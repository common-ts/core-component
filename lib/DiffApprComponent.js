"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0: case 1: t = op; break;
        case 4: _.label++; return { value: op[1], done: false };
        case 5: _.label++; y = op[1]; op = [0]; continue;
        case 7: op = _.ops.pop(); _.trys.pop(); continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
          if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
          if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
          if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
          if (t[2]) _.ops.pop();
          _.trys.pop(); continue;
      }
      op = body.call(thisArg, _);
    } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
    if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
};
Object.defineProperty(exports, "__esModule", { value: true });
var reflectx_1 = require("reflectx");
var core_1 = require("./core");
var Status;
(function (Status) {
  Status[Status["NotFound"] = 0] = "NotFound";
  Status[Status["Success"] = 1] = "Success";
  Status[Status["VersionError"] = 2] = "VersionError";
  Status[Status["Error"] = 4] = "Error";
})(Status = exports.Status || (exports.Status = {}));
var DiffApprComponent = (function () {
  function DiffApprComponent(service, resourceService, getLocale, showMessage, showError, loading) {
    this.service = service;
    this.resourceService = resourceService;
    this.getLocale = getLocale;
    this.showMessage = showMessage;
    this.showError = showError;
    this.loading = loading;
    this.id = null;
    this.origin = {};
    this.value = {};
    this.disabled = false;
    this.resource = resourceService.resource();
    this.back = this.back.bind(this);
    this.approve = this.approve.bind(this);
    this.reject = this.reject.bind(this);
    this.format = this.format.bind(this);
    this.formatFields = this.formatFields.bind(this);
    this.load = this.load.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
    this.alertError = this.alertError.bind(this);
  }
  DiffApprComponent.prototype.back = function () {
    window.history.back();
  };
  DiffApprComponent.prototype.load = function (_id) {
    return __awaiter(this, void 0, void 0, function () {
      var x, dobj, formatdDiff, err_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            x = _id;
            if (!(x && x !== '')) return [3, 5];
            this.id = _id;
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            this.running = true;
            if (this.loading) {
              this.loading.showLoading();
            }
            return [4, this.service.diff(_id)];
          case 2:
            dobj = _a.sent();
            if (!dobj) {
              this.handleNotFound(this.form);
            }
            else {
              formatdDiff = formatDiffModel(dobj, this.formatFields);
              this.format(formatdDiff.origin, formatdDiff.value);
              this.value = formatdDiff.value;
              this.origin = formatdDiff.origin;
            }
            return [3, 5];
          case 3:
            err_1 = _a.sent();
            this.handleError(err_1);
            return [3, 5];
          case 4:
            this.running = false;
            if (this.loading) {
              this.loading.hideLoading();
            }
            return [7];
          case 5: return [2];
        }
      });
    });
  };
  DiffApprComponent.prototype.handleNotFound = function (form) {
    this.disabled = true;
    this.alertError(this.resourceService.value('error_not_found'));
  };
  DiffApprComponent.prototype.format = function (origin, value) {
    var differentKeys = reflectx_1.diff(origin, value);
    var form = this.form;
    for (var _i = 0, differentKeys_1 = differentKeys; _i < differentKeys_1.length; _i++) {
      var differentKey = differentKeys_1[_i];
      var y = form.querySelector('.' + differentKey);
      if (y) {
        if (y.childNodes.length === 3) {
          y.children[1].classList.add('highlight');
          y.children[2].classList.add('highlight');
        }
        else {
          y.classList.add('highlight');
        }
      }
    }
  };
  DiffApprComponent.prototype.formatFields = function (value) {
    return value;
  };
  DiffApprComponent.prototype.approve = function (event) {
    return __awaiter(this, void 0, void 0, function () {
      var status_1, r, err_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            event.preventDefault();
            if (this.running) {
              return [2];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            this.running = true;
            if (this.loading) {
              this.loading.showLoading();
            }
            return [4, this.service.approve(this.id)];
          case 2:
            status_1 = _a.sent();
            r = this.resourceService;
            if (status_1 === Status.Success) {
              this.showMessage(r.value('msg_approve_success'));
            }
            else if (status_1 === Status.VersionError) {
              this.showMessage(r.value('msg_approve_version_error'));
            }
            else if (status_1 === Status.NotFound) {
              this.handleNotFound(this.form);
            }
            else {
              this.alertError(r.value('msg_approve_version_error'));
            }
            return [3, 5];
          case 3:
            err_2 = _a.sent();
            this.handleError(err_2);
            return [3, 5];
          case 4:
            this.disabled = true;
            this.running = false;
            if (this.loading) {
              this.loading.hideLoading();
            }
            return [7];
          case 5: return [2];
        }
      });
    });
  };
  DiffApprComponent.prototype.reject = function (event) {
    return __awaiter(this, void 0, void 0, function () {
      var status_2, r, err_3, data;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            event.preventDefault();
            if (this.running) {
              return [2];
            }
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, 4, 5]);
            this.running = true;
            if (this.loading) {
              this.loading.showLoading();
            }
            return [4, this.service.reject(this.id)];
          case 2:
            status_2 = _a.sent();
            r = this.resourceService;
            if (status_2 === Status.Success) {
              this.showMessage(r.value('msg_reject_success'));
            }
            else if (status_2 === Status.VersionError) {
              this.showMessage(r.value('msg_approve_version_error'));
            }
            else if (status_2 === Status.NotFound) {
              this.handleNotFound(this.form);
            }
            else {
              this.alertError(r.value('msg_reject_error'));
            }
            return [3, 5];
          case 3:
            err_3 = _a.sent();
            data = (err_3 && err_3.response) ? err_3.response : err_3;
            if (data && data.status === 404) {
              this.handleNotFound();
            }
            else {
              this.handleError(err_3);
            }
            return [3, 5];
          case 4:
            this.disabled = true;
            this.running = false;
            if (this.loading) {
              this.loading.hideLoading();
            }
            return [7];
          case 5: return [2];
        }
      });
    });
  };
  DiffApprComponent.prototype.handleError = function (err) {
    var r = this.resourceService;
    var msg = r.value('error_internal');
    if (err) {
      var data = err.response ? err.response : err;
      var status_3 = data.status;
      if (status_3 && !isNaN(status_3)) {
        msg = core_1.messageByHttpStatus(status_3, r);
      }
    }
    this.alertError(msg);
  };
  DiffApprComponent.prototype.alertError = function (msg) {
    var title = this.resourceService.value('error');
    this.showError(msg, title);
  };
  return DiffApprComponent;
}());
exports.DiffApprComponent = DiffApprComponent;
function formatDiffModel(obj, formatFields) {
  if (!obj) {
    return obj;
  }
  var obj2 = reflectx_1.clone(obj);
  if (!obj2.origin) {
    obj2.origin = {};
  }
  else {
    if (typeof obj2.origin === 'string') {
      obj2.origin = JSON.parse(obj2.origin);
    }
    if (formatFields && typeof obj2.origin === 'object' && !Array.isArray(obj2.origin)) {
      obj2.origin = formatFields(obj2.origin);
    }
  }
  if (!obj2.value) {
    obj2.value = {};
  }
  else {
    if (typeof obj2.value === 'string') {
      obj2.value = JSON.parse(obj2.value);
    }
    if (formatFields && typeof obj2.value === 'object' && !Array.isArray(obj2.value)) {
      obj2.value = formatFields(obj2.value);
    }
  }
  return obj2;
}
exports.formatDiffModel = formatDiffModel;
