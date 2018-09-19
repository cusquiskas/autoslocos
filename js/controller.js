class FormController {
    creaParametro(nombre, objeto) {
        if (typeof (this.parametros[nombre]) == 'undefined') this.parametros[nombre] = {};
        this.parametros[nombre].submit = objeto.submit || this.parametros[nombre].submit || false;
        this.parametros[nombre].label = objeto.label || this.parametros[nombre].label || false;
        this.parametros[nombre].object = objeto.object || this.parametros[nombre].object;
        this.parametros[nombre].value = objeto.value || this.parametros[nombre].value || '';
        this.parametros[nombre].select = objeto.select || this.parametros[nombre].select || false;
        this.parametros[nombre].preValue = objeto.preValue || this.parametros[nombre].preValue || '';
        this.parametros[nombre].storeDep = objeto.storeDep || this.parametros[nombre].storeDep || false;
        this.parametros[nombre].getAll = objeto.getAll || this.parametros[nombre].getAll || false;
    }

    masParametros(Element) {
        for (let x = 0; x < Element.length; x++) {
            let me = this;
            let nombre = Element[x].name;
            if (nombre) {
                Element[x].addEventListener('change', function () {
                    me.parametros[nombre].value = Element[x].value;
                });
                this.creaParametro(nombre, {
                    submit: (Element[x].getAttribute('frC-Submit') === 'false') ? false : true,
                    object: Element[x],
                    value: (Element[x].type != 'submit') ? Element[x].value : '',
                    select: (Element[x].nodeName == 'SELECT') ? true : false,
                    storeDep: (typeof Element[x].getAttribute('frC-Dependency') == 'string') ? (me.parametros[Element[x].getAttribute('frC-Dependency')] || null) : null,
                    getAll: (typeof Element[x].getAttribute('frC-getAllSeparator') == 'string' && Element[x].getAttribute('frC-getAllSeparator').length > 0) ? true : false
                });
            }
            if (Element[x].type == 'submit') {
                Element[x].type = 'button';
                Element[x].addEventListener('click', function () {
                    if (Element[x].name) me.parametros[nombre].value = Element[x].value;
                    me.executeForm();
                });
            }
        }
    }

    masInjertos(Graft) {
        for (let x = 0; x < Graft.length; x++) {
            let nombre = Graft[x].getAttribute('name');
            if (nombre) {
                this.creaParametro(nombre, {
                    label: true,
                    object: Graft[x],
                    value: Graft[x].innerHTML
                });
            }
        }
    }

    invocaStore(Select) {
        let abort = false,
            params = {};
        if (Select.getAttribute('frC-Reference')) {
            let map, ref = Select.getAttribute('frC-Reference').split(',');
            for (let y = 0; y < ref.length; y++) {
                map = ref[y].split(':');
                if (map[0].indexOf('?') < 0 && (this.parametros[map[1]].value == '' || this.parametros[map[1]].value == undefined)) {
                    abort = true;
                } else {
                    map[0].replace('?', '');
                    params[map[0]] = this.parametros[map[1]].value || '';
                }
            }
        }

        if (!abort) {
            let me = this;
            this.loading(Select.name, true);
            this.ajax({
                extra: me,
                action: Select.getAttribute('frC-Store'),
                params: params,
                extra: {
                    form: me
                },
                function: function (s, d, e) {
                    me.loading(Select.name, false);
                    if (s) {
                        let raiz = Select.getAttribute('frC-indexResponse').split(':');
                        let masRaiz = raiz[0].split('.');
                        let opciones = d;
                        for (let j = 0; j < masRaiz.length; j++) opciones = opciones[masRaiz[j]];
                        if (!me.parametros[Select.name].storeDep) {
                            // no hay dependencia, procedo a carga normal del combo
                            raiz = raiz[1].split(',');
                            for (let y = 0; y < opciones.length; y++) {
                                Select[Select.length] = new Option(opciones[y][raiz[0]], opciones[y][raiz[1]] || '');
                            }
                            if (me.parametros[Select.name].preValue != '') {
                                Select.value = me.parametros[Select.name].preValue;
                                me.parametros[Select.name].preValue = '';
                                let event = document.createEvent("Event"); event.initEvent('change', false, true);
                                Select.dispatchEvent(event);
                            }
                        } else {
                            // hay dependencia, tengo que mover las opciones del primero al segundo
                            raiz = raiz[1];
                            for (let y = 0; y < opciones.length; y++) {
                                me.parametros[Select.name].storeDep.object.value = opciones[y][raiz];
                                if (me.parametros[Select.name].storeDep.object.options.selectedIndex > -1) {
                                    Select.appendChild(me.parametros[Select.name].storeDep.object.options[me.parametros[Select.name].storeDep.object.options.selectedIndex]);
                                    me.parametros[Select.name].storeDep.object.options[me.parametros[Select.name].storeDep.object.options.selectedIndex] = null
                                }
                            }
                        }
                        let event = document.createEvent("Event"); event.initEvent('ajaxSuccess', false, true);
                        Select.dispatchEvent(event);
                    } else {
                        if (!Moduls.relogin.lanzado) {
                            if (((d.type === 'getSesion' || d.type === 'getSession' || d.type === 'getSessionException') && (d.code === 3 || d.code === 3.0 || d.code === '3'))) {
                                me.relogin(me.modul);
                            } else {
                                throw d;
                            }
                        }
                    }
                }
            });
        }
    }

    cargaSelects(Selects) {
        let me = this;
        for (let x = 0; x < Selects.length; x++) {
            if (Selects[x].getAttribute('frC-Store')) {
                if (Selects[x].getAttribute('frC-Reference')) {
                    let ref = Selects[x].getAttribute('frC-Reference').split(',');
                    for (let y = 0; y < ref.length; y++) {
                        let map = ref[y].split(':');
                        this.parametros[map[1]].object.addEventListener('change', function () {
                            Selects[x].length = 0;
                            me.invocaStore(Selects[x]);
                        })
                    }
                }

                if (Selects[x].getAttribute('frC-Dependency')) {
                    let ref = Selects[x].getAttribute('frC-Dependency');
                    if (this.parametros[ref].object.options.length == 0)
                        this.parametros[ref].object.addEventListener('ajaxSuccess', function () {
                            me.invocaStore(Selects[x]);
                        })
                }

                this.invocaStore(Selects[x]);
            }
        }
    }

    get() {
        let obj = {};
        for (let chd in this.parametros) {
            if (this.parametros[chd].submit) {
                if (this.parametros[chd].getAll) {
                    if (this.parametros[chd].select) {
                        let cad = '', sep = this.parametros[chd].object.getAttribute('frC-getAllSeparator');
                        for (let x = 0; x < this.parametros[chd].object.options.length; x++) cad += (sep + this.parametros[chd].object.options[x].value);
                        obj[chd] = cad.substr(sep.length);
                    }
                } else {
                    if (this.parametros[chd].object.type && this.parametros[chd].object.type === "date") {
                        obj[chd] = (this.parametros[chd].value) ? this.parametros[chd].value.hazFecha('yyyy-mm-dd', 'dd/mm/yyyy') : '';
                    } else {
                        obj[chd] = this.parametros[chd].value;
                    }
                }

            }
        }
        return obj;
    }

    set(objeto) {
        for (let chd in objeto) {
            if (typeof (this.parametros[chd]) != 'undefined') {
                this.parametros[chd].value = (objeto[chd] || '');
                if (this.parametros[chd].label) {
                    while (this.parametros[chd].object.childNodes.length > 0) this.parametros[chd].object.removeChild(this.parametros[chd].object.childNodes[0]);
                    this.parametros[chd].object.appendChild(document.createTextNode((objeto[chd] || '')));
                } else {
                    this.parametros[chd].object.value = (objeto[chd] || '');
                    if (this.parametros[chd].select) this.parametros[chd].preValue = (objeto[chd] || '');
                }
                let event = document.createEvent("Event"); event.initEvent('change', false, true);
                this.parametros[chd].object.dispatchEvent(event);
            }
        }
    }

    ajax(objeto) {
        invocaAjax({
            direccion: objeto.action,
            metodo: objeto.method || 'GET',
            parametros: objeto.params || '',
            contentType: objeto.contentType || 'application/json',
            autoXSID: (objeto.autoXSID === false ? false : true),
            caracteres: 'utf-8',
            extra: objeto.extra || {},
            retorno: objeto.function
        });
    }

    loading(n, a) {
        if (a) {
            //let templateLoaing = document.getElementById('loader');
            let newLoading = document.createElement('template');
            newLoading.setAttribute('id', 'loader_' + n);
            document.body.appendChild(newLoading);
            let LoadingModul = new ModulController(newLoading, null);
            LoadingModul.load({
                url: '/portalapp/modulos/loader/loader.html'
            });
        } else {
            let newLoading = document.getElementById('loader_' + n);
            // ñapa IE
            newLoading.parentNode.removeChild(newLoading);
            // newLoading.remove();
            //Fin ñapa
        }
    }

    relogin(a) {
        Moduls.relogin.lanzado = true;
        Moduls.relogin.websesion = top.SESION_ID;
        top.SESION_ID = "";
        Moduls.relogin.child.modalBodyRelogin.load({ url: '/portalapp/modulos/login/reLogin.html', script: true });
        construirModal({
            title: 'Sesión caducada, vuelva a iniciar sesión',
            w: 550,
            relogin: true
        });
    }

    executeForm() {
        let me = this;
        let errores = this.validate();
        if (errores.length > 0) this.formulario.getAttribute('frC-CallBack') && window[this.formulario.getAttribute('frC-CallBack')](false, errores, { form: this, status: 'validation' });
        else {
            if (this.formulario.getAttribute('action') !== null) {
                this.loading(this.formulario.name, true);
                this.ajax({
                    action: this.formulario.action,
                    method: this.formulario.method,
                    params: this.get(),
                    extra: {
                        form: me
                    },
                    contentType: this.formulario.getAttribute('Content-Type') || 'application/json',
                    autoXSID: !(this.formulario.getAttribute('frC-noSesion') && this.formulario.getAttribute('frC-noSesion') === 'true'),
                    function: function (s, d, e) {
                        me.loading(me.formulario.name, false);
                        if (!Moduls.relogin.lanzado) {
                            if ((!s && (d.type === 'getSesion' || d.type === 'getSession' || d.type === 'getSessionException') && (d.code === 3 || d.code === 3.0 || d.code === '3'))) {
                                me.relogin(me.modul);
                            } else {
                                me.formulario.getAttribute('frC-CallBack') && window[me.formulario.getAttribute('frC-CallBack')](s, d, e);
                            }
                        }
                    }
                });
            } else {
                this.formulario.getAttribute('frC-CallBack') && window[this.formulario.getAttribute('frC-CallBack')](true, {}, { form: me });
            }
        }
    }

    localizaLabel(nombre) {
        let Labels = this.formulario.getElementsByTagName('label');
        for (let x = 0; x < Labels.length; x++) {
            if (Labels[x].getAttribute('for') && Labels[x].getAttribute('for') === nombre)
                return Labels[x].childNodes[0].data;
        }
    }

    validate() {
        let me = this;
        let errores = [];
        let Element = this.formulario.elements;
        let variant;
        for (let x = 0; x < Element.length; x++) {
            if (Element[x].name) {
                let label = this.localizaLabel(Element[x].name) || '';
                if ((Element[x].required && Element[x].value == '' && !Element[x].getAttribute('frC-getAllSeparator')) ||
                    (Element[x].getAttribute('frC-getAllSeparator') && Element[x].options.length == 0)) errores.push({
                        name: Element[x].name,
                        type: 'required',
                        label: label
                    });
                switch (Element[x].type) {
                    case 'number':
                        if (Element[x].value != '' && !Element[x].value.esNumero()) errores.push({
                            name: Element[x].name,
                            type: 'NaN',
                            label: label
                        });
                        break;
                    case 'date':
                        if (Element[x].value != '' && !Element[x].value.esFecha('yyyy-mm-dd')) errores.push({
                            name: Element[x].name,
                            type: 'NaD',
                            label: label
                        });
                        break;
                    case 'checkbox':
                        if (Element[x].required && !Element[x].checked) errores.push({
                            name: Element[x].name,
                            type: 'required',
                            label: label
                        });
                        break;
                }
                if (Element[x].getAttribute('frC-Validate') && Element[x].getAttribute('frC-Validate')!=='') {
                    switch (Element[x].getAttribute('frC-Validate')) {
                        case 'IBAN':
                            Element[x].value = Element[x].value.toUpperCase();
                            Element[x].value = Element[x].value.replace(/[^\dA-Z]/g,'');
                            let event = document.createEvent("Event"); event.initEvent('focus', false, true);
                            Element[x].dispatchEvent(event);
                            if (isNaN(Element[x].value.substr(3,Element[x].value.length-2))) {
                                errores.push({name: Element[x].name, type: 'invalid', label: label});
                            } else {
                                variant = {
                                    iban:Element[x].value,
                                    entidad:Element[x].value.substr(4,4),
                                    oficina:Element[x].value.substr(8,4),
                                    dc:Element[x].value.substr(12,2),
                                    cuenta:Element[x].value.substr(14,10),
                                    pais:Element[x].value.substr(0,2)
                                };
                                if (!comprobarDC(variant,'IBAN')) errores.push({name: Element[x].name, type: 'invalid', label: label });
                            }
                            break;
                    }
                }
            }
        }
        return errores;
    }


    constructor(formulario, template) {
        this.parametros = {};
        this.masParametros(formulario.elements);
        this.masInjertos(formulario.getElementsByTagName('frC-Graft'));
        this.cargaSelects(formulario.getElementsByTagName('select'));
        this.formulario = formulario;
        this.modul = template;
        formulario.getAttribute('frC-AutoLoad') && formulario.getAttribute('frC-AutoLoad') === 'true' && this.executeForm();
    }
}

class ModulController {

    secciona(data, param) {
        return $("div." + param, data)[0] || '';
    }

    return(url) {
        if (VERSION !== false) url = url.replace('.html', '.' + VERSION + '.html');
        let me = this,
            direcc = url,
            result = "";
        $.ajax({
            url: url,
            method: 'GET',
            async: false,
            success: function (data, status) {
                result = (!direcc.split('?')[1]) ? data : me.secciona(data, direcc.split('?')[1]);
            }
        });

        return typeof result == 'string' ? result : result.outerHTML;
    }

    enlazarScript(datos, script, donde) {
        if (script === true) {
            let url = datos.slice(0, -4) + 'js';
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            $(donde).append(script);
        }
    }

    load(objeto) {
        let me = this;
        $(this.name).empty();
        if (VERSION !== false) objeto.url = objeto.url.replace('.html', '.' + VERSION + '.html');
        $.get(objeto.url, function (data, status) {
            data = (!objeto.url.split('?')[1]) ? data : me.secciona(data, objeto.url.split('?')[1]);
            $(me.name).append(data);
            me.enlazarScript(objeto.url, objeto.script, me.name);
            me.child = [];
            let Template = me.template.getElementsByTagName('template');
            for (let i = 0; i < Template.length; i++) me.child[Template[i].id] = new ModulController(Template[i], me);
            me.Forms = [];
            let formularios = me.template.getElementsByTagName('form');
            for (let i = 0; i < formularios.length; i++) if (formularios[i].name) me.Forms[formularios[i].name] = new FormController(formularios[i], me);
        });
    }

    constructor(Template, ModulControler) {
        this.template = Template;
        this.name = '#' + Template.id;
        this.padre = ModulControler;
    }
}

let Moduls = [],
    Template = document.getElementsByTagName('template');
for (let i = 0; i < Template.length; i++) Moduls[Template[i].id] = new ModulController(Template[i], null);
Moduls.Forms = [];
for (let i = 0; i < document.forms.length; i++) Moduls.Forms[document.forms[i].name] = new FormController(document.forms[i], null);