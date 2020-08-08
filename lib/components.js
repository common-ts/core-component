"use strict";
var __extends = (this && this.__extends) || (function(){
  var extendStatics=function(d, b){
    extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function(d, b){ d.__proto__ = b; }) ||
      function(d, b){ for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
  };
  return function(d, b){
    extendStatics(d, b);
    function __(){ this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator){
  function adopt(value){ return value instanceof P ? value : new P(function(resolve){ resolve(value); }); }
  return new (P || (P = Promise))(function(resolve, reject){
    function fulfilled(value){ try { step(generator.next(value)); } catch (e){ reject(e); } }
    function rejected(value){ try { step(generator["throw"](value)); } catch (e){ reject(e); } }
    function step(result){ result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = (this && this.__generator) || function(thisArg, body){
  var _ = { label: 0, sent: function(){ if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator]=function(){ return this; }), g;
  function verb(n){ return function(v){ return step([n, v]); }; }
  function step(op){
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]){
        case 0: case 1: t = op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y = op[1]; op = [0]; continue;
        case 7: op = _.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)){ _ = 0; continue; }
          if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))){ _.label = op[1]; break; }
          if (op[0] === 6 && _.label < t[1]){ _.label = t[1]; t = op; break; }
          if (t && _.label < t[2]){ _.label = t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op = body.call(thisArg, _);
    } catch (e){ op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(exports,"__esModule",{value:true});
var form_util_1 = require("form-util");
var model_formatter_1 = require("model-formatter");
var reflectx_1 = require("reflectx");
var search_utilities_1 = require("search-utilities");
var core_1 = require("./core");
var core_2 = require("./core");
var edit_1 = require("./edit");
var BaseViewComponent=(function(){
  function BaseViewComponent(resourceService, getLocale){
    this.resourceService = resourceService;
    this.getLocale = getLocale;
    this.includeCurrencySymbol = false;
    this.resource = resourceService.resource();
    this.currencySymbol = this.currencySymbol.bind(this);
    this.getCurrencyCode = this.getCurrencyCode.bind(this);
    this.back = this.back.bind(this);
  }
  BaseViewComponent.prototype.back=function(){
    window.history.back();
  };
  BaseViewComponent.prototype.currencySymbol=function(){
    return this.includeCurrencySymbol;
  };
  BaseViewComponent.prototype.getCurrencyCode=function(){
    return (this.form ? this.form.getAttribute('currency-code') : null);
  };
  return BaseViewComponent;
}());
exports.BaseViewComponent = BaseViewComponent;
var ViewComponent=(function(_super){
  __extends(ViewComponent, _super);
  function ViewComponent(service, resourceService, getLocale, showError, loading){
    var _this = _super.call(this, resourceService, getLocale) || this;
    _this.service = service;
    _this.showError = showError;
    _this.loading = loading;
    _this.metadata = service.metadata();
    _this.load = _this.load.bind(_this);
    _this.getModelName = _this.getModelName.bind(_this);
    _this.showModel = _this.showModel.bind(_this);
    _this.getModel = _this.getModel.bind(_this);
    _this.handleError = _this.handleError.bind(_this);
    _this.handleNotFound = _this.handleNotFound.bind(_this);
    return _this;
  }
  ViewComponent.prototype.load=function(_id){
    return __awaiter(this, void 0, void 0, function(){
      var id, obj, err_1;
      return __generator(this, function(_a){
        switch (_a.label){
          case 0:
            id = _id;
            if (!(id && id !== '')) return [3, 5];
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            this.running = true;
            if (this.loading){
              this.loading.showLoading();
            }
            return [4, this.service.load(id)];
          case 2:
            obj = _a.sent();
            if (obj){
              this.showModel(obj);
            }
            else {
              this.handleNotFound(this.form);
            }
            return [3, 5];
          case 3:
            err_1 = _a.sent();
            this.handleError(err_1);
            return [3, 5];
          case 4:
            this.running = false;
            if (this.loading){
              this.loading.hideLoading();
            }
            return [7];
          case 5: return [2];
        }
      });
    });
  };
  ViewComponent.prototype.handleNotFound=function(form){
    var msg = core_2.message(this.resourceService, 'error_not_found', 'error');
    if (this.form){
      form_util_1.readOnly(form);
    }
    this.showError(msg.message, msg.title);
  };
  ViewComponent.prototype.handleError=function(response){
    var r = this.resourceService;
    var title = r.value('error');
    var msg = r.value('error_internal');
    if (response){
      if (response.status && !isNaN(response.status)){
        msg = core_1.messageByHttpStatus(response.status, r);
      }
    }
    this.showError(msg, title);
  };
  ViewComponent.prototype.getModelName=function(){
    return (this.metadata ? this.metadata.name : 'model');
  };
  ViewComponent.prototype.showModel=function(model){
    var name = this.getModelName();
    this[name] = model;
  };
  ViewComponent.prototype.getModel=function(){
    var name = this.getModelName();
    var model = this[name];
    return model;
  };
  return ViewComponent;
}(BaseViewComponent));
exports.ViewComponent = ViewComponent;
var BaseComponent=(function(_super){
  __extends(BaseComponent, _super);
  function BaseComponent(resourceService, ui, getLocale, showError, loading){
    var _this = _super.call(this, resourceService, getLocale) || this;
    _this.showError = showError;
    _this.loading = loading;
    _this.uiS1 = ui;
    _this.getModelName = _this.getModelName.bind(_this);
    _this.updateState = _this.updateState.bind(_this);
    _this.updateStateFlat = _this.updateStateFlat.bind(_this);
    _this.handleError = _this.handleError.bind(_this);
    return _this;
  }
  BaseComponent.prototype.getModelName=function(){
    return 'state';
  };
  BaseComponent.prototype.updateState=function(event){
    this.updateStateFlat(event, this.getLocale());
  };
  BaseComponent.prototype.updateStateFlat=function(e, locale){
    var ctrl = e.currentTarget;
    var modelName = this.getModelName();
    if (!modelName){
      modelName = ctrl.form.getAttribute('model-name');
    }
    var type = ctrl.getAttribute('type');
    var isPreventDefault = type && (['checkbox', 'radio'].indexOf(type.toLowerCase()) >= 0 ? false : true);
    if (isPreventDefault){
      e.preventDefault();
    }
    if (ctrl.nodeName === 'SELECT' && ctrl.value && ctrl.classList.contains('invalid')){
      this.uiS1.removeErrorMessage(ctrl);
    }
    var ex = this[modelName];
    var dataField = ctrl.getAttribute('data-field');
    var field = (dataField ? dataField : ctrl.name);
    if (type && type.toLowerCase() === 'checkbox'){
      reflectx_1.setValue(ex, field, this.uiS1.getValue(ctrl));
    }
    else {
      var v = this.uiS1.getValue(ctrl, locale);
      if (ctrl.value != v){
        reflectx_1.setValue(ex, field, v);
      }
    }
  };
  BaseComponent.prototype.handleError=function(response){
    this.running = false;
    if (this.loading){
      this.loading.hideLoading();
    }
    var r = this.resourceService;
    var title = r.value('error');
    var msg = r.value('error_internal');
    if (!response){
      this.showError(msg, title);
      return;
    }
    var status = response.status;
    if (status && !isNaN(status)){
      msg = core_1.messageByHttpStatus(status, r);
    }
    if (status === 403){
      msg = r.value('error_forbidden');
      form_util_1.readOnly(this.form);
      this.showError(msg, title);
    }
    else if (status === 401){
      msg = r.value('error_unauthorized');
      form_util_1.readOnly(this.form);
      this.showError(msg, title);
    }
    else {
      this.showError(msg, title);
    }
  };
  return BaseComponent;
}(BaseViewComponent));
exports.BaseComponent = BaseComponent;
var EditComponent=(function(_super){
  __extends(EditComponent, _super);
  function EditComponent(service, resourceService, getLocale, showMessage, ui, alertService, loading, patchable, backOnSaveSuccess){
    var _this = _super.call(this, resourceService, ui, getLocale, alertService.alertError, loading) || this;
    _this.service = service;
    _this.showMessage = showMessage;
    _this.ui = ui;
    _this.alertService = alertService;
    _this.newMode = false;
    _this.setBack = false;
    _this.patchable = true;
    _this.backOnSuccess = true;
    _this.orginalModel = null;
    _this.addable = true;
    _this.editable = true;
    _this.load = _this.load.bind(_this);
    _this.resetState = _this.resetState.bind(_this);
    _this.handleNotFound = _this.handleNotFound.bind(_this);
    _this.createModel = _this.createModel.bind(_this);
    _this.formatModel = _this.formatModel.bind(_this);
    _this.showModel = _this.showModel.bind(_this);
    _this.getModelName = _this.getModelName.bind(_this);
    _this.getModel = _this.getModel.bind(_this);
    _this.getRawModel = _this.getRawModel.bind(_this);
    _this.metadata = service.metadata();
    _this.metamodel = edit_1.build(_this.metadata);
    _this.newOnClick = _this.newOnClick.bind(_this);
    _this.saveOnClick = _this.saveOnClick.bind(_this);
    _this.onSave = _this.onSave.bind(_this);
    _this.confirm = _this.confirm.bind(_this);
    _this.validate = _this.validate.bind(_this);
    _this.save = _this.save.bind(_this);
    _this.succeed = _this.succeed.bind(_this);
    _this.successMessage = _this.successMessage.bind(_this);
    _this.save = _this.save.bind(_this);
    _this.postSave = _this.postSave.bind(_this);
    _this.handleDuplicateKey = _this.handleDuplicateKey.bind(_this);
    if (patchable === false){
      _this.patchable = patchable;
    }
    if (backOnSaveSuccess === false){
      _this.backOnSuccess = backOnSaveSuccess;
    }
    _this.insertSuccessMsg = resourceService.value('msg_save_success');
    _this.updateSuccessMsg = resourceService.value('msg_save_success');
    return _this;
  }
  EditComponent.prototype.load=function(_id, callback){
    return __awaiter(this, void 0, void 0, function(){
      var id, com, obj, err_2;
      return __generator(this, function(_a){
        switch (_a.label){
          case 0:
            id = _id;
            if (!(id && id !== '')) return [3, 6];
            com = this;
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            return [4, this.service.load(id)];
          case 2:
            obj = _a.sent();
            if (callback){
              callback(obj);
            }
            if (!obj){
              com.handleNotFound(com.form);
            }
            else {
              this.resetState(false, obj, reflectx_1.clone(obj));
            }
            return [3, 5];
          case 3:
            err_2 = _a.sent();
            if (err_2 && err_2.status === 404){
              com.handleNotFound(com.form);
            }
            else {
              com.handleError(err_2);
            }
            return [3, 5];
          case 4:
            com.running = false;
            if (this.loading){
              this.loading.hideLoading();
            }
            return [7];
          case 5: return [3, 7];
          case 6:
            this.resetState(true, this.createModel(), null);
            _a.label = 7;
          case 7: return [2];
        }
      });
    });
  };
  EditComponent.prototype.resetState=function(newMod, model, originalModel){
    this.newMode = newMod;
    this.orginalModel = originalModel;
    this.formatModel(model);
    this.showModel(model);
  };
  EditComponent.prototype.handleNotFound=function(form){
    var msg = core_2.message(this.resourceService, 'error_not_found', 'error');
    if (this.form){
      form_util_1.readOnly(form);
    }
    this.alertService.alertError(msg.message, msg.title);
  };
  EditComponent.prototype.formatModel=function(obj){
    model_formatter_1.format(obj, this.metamodel, this.getLocale(), this.getCurrencyCode(), this.currencySymbol());
  };
  EditComponent.prototype.getModelName=function(){
    return (this.metadata ? this.metadata.name : 'model');
  };
  EditComponent.prototype.showModel=function(model){
    var n = this.getModelName();
    this[n] = model;
  };
  EditComponent.prototype.getRawModel=function(){
    var name = this.getModelName();
    var model = this[name];
    return model;
  };
  EditComponent.prototype.getModel=function(){
    var name = this.getModelName();
    var model = this[name];
    var obj = reflectx_1.clone(model);
    model_formatter_1.json(obj, this.metamodel, this.getLocale(), this.getCurrencyCode());
    return obj;
  };
  EditComponent.prototype.createModel=function(){
    var metadata = this.service.metadata();
    if (metadata){
      var obj = edit_1.createModel(metadata);
      return obj;
    }
    else {
      var obj = {};
      return obj;
    }
  };
  EditComponent.prototype.newOnClick=function(event){
    if (!this.form && event && event.target && event.target.form){
      this.form = event.target.form;
    }
    this.resetState(true, this.createModel(), null);
    var u = this.ui;
    var f = this.form;
    setTimeout(function(){
      u.removeFormError(f);
    }, 100);
  };
  EditComponent.prototype.saveOnClick=function(event, isBack){
    if (!this.form && event && event.target){
      this.form = event.target.form;
    }
    if (isBack){
      this.onSave(isBack);
    }
    else {
      this.onSave(this.backOnSuccess);
    }
  };
  EditComponent.prototype.onSave=function(isBack){
    var _this = this;
    var r = this.resourceService;
    if (this.newMode && this.addable !== true){
      var msg = core_2.message(r, 'error_permission_add', 'error_permission');
      this.alertService.alertError(msg.message, msg.title);
      return;
    }
    else if (!this.newMode && this.editable !== true){
      var msg = core_2.message(r, 'error_permission_edit', 'error_permission');
      this.alertService.alertError(msg.message, msg.title);
      return;
    }
    else {
      if (this.running === true){
        return;
      }
      var com_1 = this;
      var obj_1 = com_1.getModel();
      var diffObj_1 = reflectx_1.makeDiff(this.orginalModel, obj_1, this.metamodel.keys, this.metamodel.version);
      var l = Object.keys(diffObj_1).length;
      if (!this.newMode && l === 0){
        this.showMessage(r.value('msg_no_change'));
      }
      else {
        com_1.validate(obj_1, function(){
          var msg = core_2.message(r, 'msg_confirm_save', 'confirm', 'yes', 'no');
          _this.confirm(msg.message, msg.title, function(){
            com_1.save(obj_1, diffObj_1, isBack);
          }, msg.no, msg.yes);
        });
      }
    }
  };
  EditComponent.prototype.confirm=function(msg, title, yesCallback, btnLeftText, btnRightText, noCallback){
    this.alertService.confirm(msg, title, yesCallback, btnLeftText, btnRightText, noCallback);
  };
  EditComponent.prototype.validate=function(obj, callback){
    var valid = this.ui.validateForm(this.form, this.getLocale());
    if (valid){
      callback(obj);
    }
  };
  EditComponent.prototype.save=function(obj, body, isBack){
    return __awaiter(this, void 0, void 0, function(){
      var isBackO, com, result, result, result, err_3;
      return __generator(this, function(_a){
        switch (_a.label){
          case 0:
            this.running = true;
            if (this.loading){
              this.loading.showLoading();
            }
            isBackO = (isBack == null || isBack === undefined ? this.backOnSuccess : isBack);
            com = this;
            _a.label = 1;
          case 1:
            _a.trys.push([1, 9, , 10]);
            if (!!this.newMode) return [3, 6];
            if (!(this.patchable === true && body && Object.keys(body).length > 0)) return [3, 3];
            return [4, this.service.patch(body)];
          case 2:
            result = _a.sent();
            com.postSave(result, isBackO);
            return [3, 5];
          case 3: return [4, this.service.update(obj)];
          case 4:
            result = _a.sent();
            com.postSave(result, isBackO);
            _a.label = 5;
          case 5: return [3, 8];
          case 6:
            reflectx_1.trim(obj);
            return [4, this.service.insert(obj)];
          case 7:
            result = _a.sent();
            com.postSave(result, isBackO);
            _a.label = 8;
          case 8: return [3, 10];
          case 9:
            err_3 = _a.sent();
            this.handleError(err_3);
            return [3, 10];
          case 10: return [2];
        }
      });
    });
  };
  EditComponent.prototype.succeed=function(msg, backOnSave, result){
    if (result){
      var model = result.value;
      this.newMode = false;
      if (model && this.setBack === true){
        if (!this.backOnSuccess){
          this.resetState(false, model, reflectx_1.clone(model));
        }
      }
      else {
        edit_1.handleVersion(this.getRawModel(), this.metamodel.version);
      }
    }
    else {
      edit_1.handleVersion(this.getRawModel(), this.metamodel.version);
    }
    this.successMessage(msg);
    if (backOnSave){
      this.back();
    }
  };
  EditComponent.prototype.successMessage=function(msg){
    this.showMessage(msg);
  };
  EditComponent.prototype.fail=function(result){
    var errors = result.errors;
    var f = this.form;
    var u = this.ui;
    var unmappedErrors = u.showFormError(f, errors);
    form_util_1.focusFirstError(f);
    if (!result.message){
      if (errors && errors.length === 1){
        result.message = errors[0].message;
      }
      else {
        result.message = u.buildErrorMessage(unmappedErrors);
      }
    }
    this.alertService.alertError(result.message);
  };
  EditComponent.prototype.postSave=function(res, backOnSave){
    this.running = false;
    if (this.loading){
      this.loading.hideLoading();
    }
    var newMod = this.newMode;
    var successMsg = (newMod ? this.insertSuccessMsg : this.updateSuccessMsg);
    var x = res;
    if (!isNaN(x)){
      if (x > 0){
        this.succeed(successMsg, backOnSave);
      }
      else {
        if (newMod){
          this.handleDuplicateKey();
        }
        else {
          this.handleNotFound();
        }
      }
    }
    else {
      var result = x;
      if (result.status === edit_1.Status.Success){
        this.succeed(successMsg, backOnSave, result);
      }
      else if (result.status === edit_1.Status.Error){
        this.fail(result);
      }
      else if (newMod && result.status === edit_1.Status.DuplicateKey){
        this.handleDuplicateKey(result);
      }
      else {
        var msg = edit_1.buildMessageFromStatusCode(result.status, this.resourceService);
        var r = this.resourceService;
        var title = r.value('error');
        if (msg && msg.length > 0){
          this.alertService.alertError(msg, title);
        }
        else if (result.message && result.message.length > 0){
          this.alertService.alertError(result.message, title);
        }
        else {
          this.alertService.alertError(r.value('error_internal'), title);
        }
      }
    }
  };
  EditComponent.prototype.handleDuplicateKey=function(result){
    var msg = core_2.message(this.resourceService, 'error_duplicate_key', 'error');
    this.alertService.alertError(msg.message, msg.title);
  };
  return EditComponent;
}(BaseComponent));
exports.EditComponent = EditComponent;
var SearchComponent=(function(_super){
  __extends(SearchComponent, _super);
  function SearchComponent(service, resourceService, ui, getLocale, showMessage, showError, loading){
    var _this = _super.call(this, resourceService, ui, getLocale, showError, loading) || this;
    _this.service = service;
    _this.ui = ui;
    _this.showMessage = showMessage;
    _this.showError = showError;
    _this.initPageSize = 20;
    _this.pageSize = 20;
    _this.pageIndex = 1;
    _this.showPaging = false;
    _this.append = false;
    _this.appendMode = false;
    _this.appendable = false;
    _this.initDisplayFields = false;
    _this.sequenceNo = 'sequenceNo';
    _this.triggerSearch = false;
    _this.loadPage = 1;
    _this.pageMaxSize = 7;
    _this.pageSizes = [10, 20, 40, 60, 100, 200, 400, 1000];
    _this.chkAll = null;
    _this.clearKeyworkOnClick=function(){
      _this.state.keyword = '';
    };
    _this.deleteHeader = resourceService.value('msg_delete_header');
    _this.deleteConfirm = resourceService.value('msg_delete_confirm');
    _this.deleteFailed = resourceService.value('msg_delete_failed');
    _this.pageChanged = _this.pageChanged.bind(_this);
    return _this;
  }
  SearchComponent.prototype.toggleFilter=function(event){
    this.hideFilter = !this.hideFilter;
  };
  SearchComponent.prototype.mergeSearchModel=function(obj, arrs, b){
    return search_utilities_1.mergeSearchModel(obj, this.pageSizes, arrs, b);
  };
  SearchComponent.prototype.load=function(s, autoSearch){
    this.loadTime = new Date();
    var obj2 = search_utilities_1.initSearchable(s, this);
    this.loadPage = this.pageIndex;
    this.setSearchModel(obj2);
    var com = this;
    if (autoSearch){
      setTimeout(function(){
        com.doSearch(true);
      }, 0);
    }
  };
  SearchComponent.prototype.setSearchForm=function(form){
    this.form = form;
  };
  SearchComponent.prototype.getSearchForm=function(){
    return this.form;
  };
  SearchComponent.prototype.setSearchModel=function(obj){
    this.state = obj;
  };
  SearchComponent.prototype.getSearchModel=function(){
    var obj2 = this.ui.decodeFromForm(this.getSearchForm(), this.getLocale(), this.getCurrencyCode());
    var obj = obj2 ? obj2 : {};
    var obj3 = search_utilities_1.optimizeSearchModel(obj, this, this.getDisplayFields());
    if (this.excluding){
      obj3.excluding = this.excluding;
    }
    return obj3;
  };
  SearchComponent.prototype.getOriginalSearchModel=function(){
    return this.state;
  };
  SearchComponent.prototype.getDisplayFields=function(){
    if (this.displayFields){
      return this.displayFields;
    }
    if (!this.initDisplayFields){
      if (this.getSearchForm()){
        this.displayFields = search_utilities_1.getDisplayFields(this.getSearchForm());
      }
      this.initDisplayFields = true;
    }
    return this.displayFields;
  };
  SearchComponent.prototype.onPageSizeChanged=function(event){
    var ctrl = event.currentTarget;
    this.pageSizeChanged(Number(ctrl.value), event);
  };
  SearchComponent.prototype.pageSizeChanged=function(size, event){
    search_utilities_1.changePageSize(this, size);
    this.tmpPageIndex = 1;
    this.doSearch();
  };
  SearchComponent.prototype.searchOnClick=function(event){
    if (event && !this.getSearchForm()){
      this.setSearchForm(event.target.form);
    }
    this.resetAndSearch();
  };
  SearchComponent.prototype.resetAndSearch=function(){
    if (this.running === true){
      this.triggerSearch = true;
      return;
    }
    search_utilities_1.reset(this);
    this.tmpPageIndex = 1;
    this.doSearch();
  };
  SearchComponent.prototype.doSearch=function(isFirstLoad){
    var _this = this;
    var listForm = this.getSearchForm();
    if (listForm){
      this.ui.removeFormError(listForm);
    }
    var s = this.getSearchModel();
    var com = this;
    this.validateSearch(s, function(){
      if (com.running === true){
        return;
      }
      com.running = true;
      if (_this.loading){
        _this.loading.showLoading();
      }
      search_utilities_1.addParametersIntoUrl(s, isFirstLoad);
      com.search(s);
    });
  };
  SearchComponent.prototype.search=function(se){
    return __awaiter(this, void 0, void 0, function(){
      var result, err_4;
      return __generator(this, function(_a){
        switch (_a.label){
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [4, this.service.search(se)];
          case 1:
            result = _a.sent();
            this.showResults(se, result);
            return [3, 3];
          case 2:
            err_4 = _a.sent();
            this.handleError(err_4);
            return [3, 3];
          case 3: return [2];
        }
      });
    });
  };
  SearchComponent.prototype.validateSearch=function(se, callback){
    var valid = true;
    var listForm = this.getSearchForm();
    if (listForm){
      valid = this.ui.validateForm(listForm, this.getLocale());
    }
    if (valid === true){
      callback();
    }
  };
  SearchComponent.prototype.searchError=function(response){
    this.pageIndex = this.tmpPageIndex;
    this.handleError(response);
  };
  SearchComponent.prototype.showResults=function(s, sr){
    var com = this;
    var results = sr.results;
    if (results != null && results.length > 0){
      var locale = this.getLocale();
      search_utilities_1.formatResults(results, this.formatter, locale, this.sequenceNo, this.pageIndex, this.pageSize, this.initPageSize);
    }
    var appendMode = com.appendMode;
    search_utilities_1.showResults(s, sr, com);
    if (appendMode === false){
      com.setList(results);
      com.tmpPageIndex = s.page;
      this.showMessage(search_utilities_1.buildSearchMessage(s, sr, this.resourceService));
    }
    else {
      if (this.append === true && s.page > 1){
        search_utilities_1.append(this.getList(), results);
      }
      else {
        this.setList(results);
      }
    }
    this.running = false;
    if (this.loading){
      this.loading.hideLoading();
    }
    if (this.triggerSearch === true){
      this.triggerSearch = false;
      this.resetAndSearch();
    }
  };
  SearchComponent.prototype.setList=function(results){
    this.list = results;
  };
  SearchComponent.prototype.getList=function(){
    return this.list;
  };
  SearchComponent.prototype.chkAllOnClick=function(event, selected){
    var target = event.currentTarget;
    var isChecked = target.checked;
    var list = this.getList();
    reflectx_1.setAll(list, selected, isChecked);
    this.handleItemOnChecked(list);
  };
  SearchComponent.prototype.itemOnClick=function(event, selected){
    var list = this.getList();
    if (this.chkAll != null){
      this.chkAll.checked = reflectx_1.equalAll(list, selected, true);
    }
    this.handleItemOnChecked(list);
  };
  SearchComponent.prototype.handleItemOnChecked=function(list){
  };
  SearchComponent.prototype.sort=function(event){
    search_utilities_1.handleSortEvent(event, this);
    if (this.appendMode === false){
      this.doSearch();
    }
    else {
      this.resetAndSearch();
    }
  };
  SearchComponent.prototype.showMore=function(){
    this.tmpPageIndex = this.pageIndex;
    search_utilities_1.more(this);
    this.doSearch();
  };
  SearchComponent.prototype.pageChanged=function(event){
    if (this.loadTime){
      var now = new Date();
      var d = Math.abs(this.loadTime.getTime() - now.getTime());
      if (d < 610){
        if (event){
          if (event.page && event.itemsPerPage && event.page !== this.loadPage){
            search_utilities_1.changePage(this, this.loadPage, event.itemsPerPage);
          }
        }
        return;
      }
    }
    search_utilities_1.changePage(this, event.page, event.itemsPerPage);
    this.doSearch();
  };
  return SearchComponent;
}(BaseComponent));
exports.SearchComponent = SearchComponent;
