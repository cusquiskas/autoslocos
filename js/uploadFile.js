class uploadProject {
  initDocument() {
    if (
      this.boxes.view &&
      this.boxes.view.value != "" &&
      this.content.value == ""
    ) {
      this._show(this.boxes.view);
      this._hide(this.boxes.eco);
      this._show(this.buttons.select);
      this._hide(this.buttons.validate);
      this._show(this.buttons.delete);
      this._show(this.buttons.viewer);
    } else {
      this._hide(this.boxes.view);
      this._show(this.boxes.eco);
      this._show(this.buttons.select);
      this._hide(this.buttons.validate);
      this._hide(this.buttons.delete);
      this._hide(this.buttons.viewer);
    }
    this.unsetDocument();
  }

  unsetDocument() {
    this.content.value = "";
    this.setFileProperties({ name: "", extension: "" });
  }

  validateDocument() {
    let input = this.content;
    let file = input.value.split("\\");
    let func = function () { };
    func =
      typeof this.validationFunction == "function"
        ? this.validationFunction
        : typeof this.callbackFunction == "function"
          ? this.callbackFunction
          : func;
    file = file[file.length - 1];
    if (
      typeof window.FileReader == "function" &&
      input.files.length > 0 &&
      input.files[0].size > this.config.smax
    ) {
      func(
        false,
        {
          type: "smax",
          operation: "upload",
          fileSize: (input.files[0].size / 1048576).toFixed(2) + "MB",
          fileMax: (this.config.smax / 1048576).toFixed(2) + "MB"
        },
        { upload: this }
      );
      this.initDocument();
      return false;
    }
    let extension = file.split(".");
    extension = "." + extension[extension.length - 1].toUpperCase().trim();
    if (
      extension == "" ||
      extension == "." ||
      !this.config.exts ||
      this.config.exts.inArray(extension) < 0
    ) {
      func(
        false,
        {
          type: "exts",
          operation: "upload",
          fileExt: extension,
          exts: this.config.exts
        },
        { upload: this }
      );
      this.initDocument();
      return false;
    }

    this.setFileProperties({ name: file, extension: extension });
    this._hide(this.buttons.select);
    this._hide(this.buttons.validate);
    this._show(this.buttons.delete);
    this._show(this.buttons.viewer);
    func(true, { operation: "upload" }, { upload: this });
    return true;
  }

  uploadDocument(object) {
    object = typeof object == "undefined" ? {} : object;
    object.ruta = object.ruta || this.config.ruta;
    object.smax = object.smax || this.config.smax;
    object.file = object.file || this.config.file;
    object.encrypt = object.encrypt || false;
    this.setConfig(object);
    if (
      this.fileProperties.name == "" ||
      this.fileProperties.name == object.file ||
      object.file == "" ||
      object.ruta == ""
    ) {
      if (typeof this.callBackFunction === "function") {
        this.callBackFunction(
          false,
          {
            type: "name",
            operation: "upload",
            origin: this.fileProperties.name,
            destin: object.file,
            ruta: object.ruta
          },
          { upload: this }
        );
      } else {
        throw {
          type: "name",
          operation: "upload",
          name: object.file,
          ruta: object.ruta
        };
      }
    } else {
      let formData = new FormData();
      formData.append("file", this.content.files[0]);
      formData.append("destFile", object.ruta);
      formData.append("fileName", object.file);
      formData.append("maxSize", object.smax);
      formData.append("encrypt", object.encrypt);
      formData.append("xsid", top.SESION_ID);
      let me = this;
      invocaAjax({
        direccion: "/management/mvc-management/uploadFile",
        method: "POST",
        parametros: {
          data: formData,
          contentType: "multipart/form-data"
        },
        retorno: function (suc, dat, ext) {
          if (typeof me.callBackFunction === "function") {
            me.callBackFunction(suc, dat, { upload: me, ext: ext });
          }
        }
      });
    }
  }

  setFileProperties(object) {
    this.fileProperties.name = object.name;
    this.fileProperties.extension = object.extension;
    this.putBoxEco(object.name);
  }

  setBtnSelect(object) {
    let me = this;
    this.buttons.select = object;
    this.buttons.select.addEventListener("click", function () {
      me.content.click();
    });
  }

  setBtnDelete(object) {
    let me = this;
    this.buttons.delete = object;
    this.buttons.delete.addEventListener("click", function () {
      if (me.content.value != "") me.content.value = "";
      else if (me.boxes.view && me.boxes.view.value != "") me.putBoxView("");
      me.initDocument();
    });
  }

  setBtnValidate(object) {
    let me = this;
    this.buttons.validate = object;
    this.buttons.validate.addEventListener("click", function () {
      me.validateDocument();
    });
  }

  setBtnViewer(object) {
    this.buttons.viewer = object;
  }

  setBoxView(object) {
    this.boxes.view = object;
  }
  putBoxView(value) {
    if (this.boxes.view) {
      this.boxes.view.value = value;
      let event = document.createEvent("Event"); event.initEvent('change', false, true);
      this.boxes.view.dispatchEvent(event);
    }
  }
  setBoxEco(object) {
    this.boxes.eco = object;
  }

  putBoxEco(value) {
    if (this.boxes.eco) {
      this.boxes.eco.value = value;
      let event = document.createEvent("Event"); event.initEvent('change', false, true);
      this.boxes.eco.dispatchEvent(event);
      if (value != "") {
        this._show(this.boxes.eco);
        this._hide(this.boxes.view);
      }
    }
  }

  setFncCallback(func) {
    if (typeof func === "function") this.callBackFunction = func;
  }

  setFncValidation(func) {
    if (typeof func === "function") this.validationFunction = func;
  }

  setConfig(object) {
    if (object) {
      this.config.smax = object.smax || this.config.smax || false;
      this.config.ruta = object.ruta || this.config.ruta || false;
      this.config.exts = object.exts || this.config.exts || false;
      this.config.file = object.file || this.config.file || false;
      this.config.autv = object.autv || this.config.autv || false;
    }
  }

  _hide(object) {
    if (object && object.style) object.style.display = "none";
  }
  _show(object) {
    if (object && object.style) object.style.display = "";
  }

  configContent() {
    let me = this;
    this.content.type = "file";
    this.content.addEventListener("change", function () {
      if (me.content.validate != "") me.validateDocument();
    });
  }

  constructor() {
    this.buttons = {};
    this.boxes = {};
    this.config = {};
    this.fileProperties = {};
    this.callbackFunction = false;
    this.validationFunction = false;
    this.content = document.createElement("input");
    this.configContent();
  }
}
