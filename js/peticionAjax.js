function peticionAjax() {
    var browser = getBrowser();
    var dato = {
        metodo: 'POST',
        direccion: '',
        caracteres: '',
        parametros: {},
        retorno: function () { alert('no se ha especificado retorno'); },
        extra: {},
        canal: '',
        asincrono: (browser.browserName == 'Internet Explorer' && parseInt(browser.browserVersion) <= 8 ? false : true),
        contentType: 'application/x-www-form-urlencoded'
    };
    this.respuesta = function () {
        var http = (dato.asincrono) ? this : this.xmlhttp;
        if (http.readyState == 4) {
            var resultado = '';
            if (http.responseType != "arraybuffer") {
                if (http.responseText == "" || http.responseText == null) {
                    try { dato.retorno(false, 'La llamada no ha devuelto datos'); } catch (e) { }
                    return; //Ha llegado una cadena vacía del servidor, abortamos el resto de comprobaciones y devolvemos la situaci�n
                }
            }
            switch (dato.canal) {
                case 'JSON':
                    try {
                        resultado = (typeof JSON != 'undefined') ? JSON.parse(http.responseText) : eval("(function(){return " + http.responseText + ";})()");
                    } catch (e) {
                        dato.retorno(false, 'No es un JSON válido:\n'+http.responseText, dato.extra);
                        return;
                    }
                    break;
                case 'XML': resultado = http.responseText; break;
                case 'FILE':
                    try {
                        if (http.status != 200) {
                            var resultado = JSON.parse(arrayBufferToString(http.response));
                        } else {
                            var type = http.getResponseHeader("Content-Type");
                            var blob = new Blob([http.response], { type: type });
                            var filename = getValueFilename(dato.parametros.originFile, dato.parametros.fileName);
                            blob.name = filename;
                            blob.filename = filename;
                            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                window.navigator.msSaveOrOpenBlob(blob, filename);
                            } else if (navigator.userAgent.toUpperCase().match('CRIOS')) {
                                var reader = new FileReader();
                                reader.onload = function () { window.open(reader.result); };
                                reader.readAsDataURL(blob);
                            } else {
                                var URL = window.URL || window.webkitURL;
                                var downloadUrl = URL.createObjectURL(blob);
                                var a = document.createElement("a");
                                a.href = downloadUrl;
                                a.target = '_blank';
                                if (!dato.parametros.preview) a.download = filename;
                                var clicEvent = new MouseEvent('click', { 'view': window, 'bubbles': true, 'cancelable': true });
                                a.dispatchEvent(clicEvent);
                                setTimeout(function () { try { URL.revokeObjectURL(downloadUrl); } catch (e) { return false; } }, 100);
                            }
                        }
                    } catch (e) {
                        dato.retorno(false, decodeURIComponent(escape(JSON.parse(e.message).errorMessage))); return;
                    }
                    break;
                default: resultado = http.responseText;
            }
            if (typeof dato.retorno == 'function') dato.retorno((http.status == 200 && (typeof resultado.success == 'undefined' || resultado.success)) ? true : false, resultado, dato.extra);
        }
    }
    this.pide = function (obj) {
        var chd, cad = '';
        dato.metodo = ((typeof obj.metodo == 'undefined') ? dato.metodo : obj.metodo).toUpperCase();
        dato.direccion = (typeof obj.direccion == 'undefined') ? dato.direccion : obj.direccion;
        dato.parametros = (typeof obj.parametros == 'undefined') ? dato.parametros : obj.parametros;
        dato.retorno = (typeof obj.retorno == 'undefined') ? dato.retorno : obj.retorno;
        dato.extra = (typeof obj.extra == 'undefined') ? dato.extra : obj.extra;
        dato.asincrono = (typeof obj.asincrono == 'undefined') ? dato.asincrono : obj.asincrono;
        dato.contentType = (typeof obj.contentType == 'undefined') ? dato.contentType : obj.contentType;
        dato.contentType = (typeof obj.parametros == 'undefined') ? dato.contentType : (typeof obj.parametros.contentType == 'undefined') ? dato.contentType : obj.parametros.contentType;
        dato.caracteres = (typeof obj.caracteres == 'undefined') ? dato.caracteres : obj.caracteres;
        dato.caracteres = ((dato.caracteres != '' && dato.caracteres != null) ? 'charset=' + dato.caracteres : '');
        dato.canal = dato.canal || obj.canal || (obj.parametros && obj.parametros.xchn) || (dato.direccion.split('.'))[(dato.direccion.split('.')).length - 1].toUpperCase() || '';
        dato.canal = dato.canal.split('?')[0].toUpperCase();
        if (window.XMLHttpRequest) { this.xmlhttp = new XMLHttpRequest(); }
        else { this.xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); }
        if (dato.asincrono) this.xmlhttp.onreadystatechange = this.respuesta;
        
        for (chd in dato.parametros) { cad += "&" + chd + "=" + escape(String(dato.parametros[chd])); } cad = cad.substr(1);
        if (dato.metodo == 'POST') {
            this.xmlhttp.open(dato.metodo, dato.direccion, dato.asincrono);
            if (dato.contentType == 'application/json') {
                this.xmlhttp.setRequestHeader("Content-type", "application/json;" + dato.caracteres + "");
                if (dato.canal == "FILE")
                    this.xmlhttp.responseType = 'arraybuffer';
                this.xmlhttp.send(JSON.stringify(obj.parametros));
            } else if (dato.contentType == 'multipart/form-data') {
                this.xmlhttp.send(dato.parametros.data);
            } else {
                this.xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded;" + dato.caracteres + "");
                if (dato.canal == "FILE") this.xmlhttp.responseType = 'arraybuffer';
                this.xmlhttp.send(cad);
            }
        } else if (dato.metodo == 'DELETE') {
            this.xmlhttp.open(dato.metodo, dato.direccion, dato.asincrono);
            this.xmlhttp.setRequestHeader("Content-type", "application/json");
            this.xmlhttp.send(JSON.stringify(obj.parametros));

        } else {
            this.xmlhttp.open("GET", dato.direccion + ((dato.direccion.indexOf('?') < 0) ? '?' : '&') + cad, dato.asincrono);
            //this.xmlhttp.setRequestHeader('Access-Control-Allow-Origin', '*');
            //this.xmlhttp.setRequestHeader('Access-Control-Allow-Methods', '*');
            this.xmlhttp.send();
        }
        if (!dato.asincrono) this.respuesta();
    }
}

function invocaAjax(obj) {
    obj = obj || {};
    if (typeof obj.direccion == 'undefined' || obj.direccion.length == 0) {
        if (typeof obj.retorno == 'function') obj.retorno(false, 'No se ha definido direcci&oacute;n de llamada');
        else alert('no se ha especificado retorno');
    } else {
        var conex = new peticionAjax();
        conex.pide(obj);
    }
}

function arrayBufferToString(buffer) {
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    if (/[\u0080-\uffff]/.test(str)) {
        throw new Error(str);
    }
    return str;
}

function getValueFilename(path, name) {
    var filename = new String();
    if (empty(name) && !empty(path))
        filename = path.substr(path.lastIndexOf("/") + 1);
    else
        filename = name;
    return filename;
}