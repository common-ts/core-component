"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Type;
(function (Type) {
  Type["ObjectId"] = "ObjectId";
  Type["Date"] = "date";
  Type["Boolean"] = "boolean";
  Type["Number"] = "number";
  Type["Integer"] = "integer";
  Type["String"] = "string";
  Type["Text"] = "text";
  Type["Object"] = "object";
  Type["Array"] = "array";
  Type["Primitives"] = "primitives";
  Type["Binary"] = "binary";
})(Type = exports.Type || (exports.Type = {}));
function message(r, msg, title, yes, no) {
  var m2 = (msg && msg.length > 0 ? r.value(msg) : '');
  var m = {
    message: m2
  };
  if (title && title.length > 0) {
    m.title = r.value(title);
  }
  if (yes && yes.length > 0) {
    m.yes = r.value(yes);
  }
  if (no && no.length > 0) {
    m.no = r.value(no);
  }
  return m;
}
exports.message = message;
function messageByHttpStatus(status, r) {
  var msg = r.value('error_internal');
  if (status === 401) {
    msg = r.value('error_unauthorized');
  }
  else if (status === 403) {
    msg = r.value('error_forbidden');
  }
  else if (status === 404) {
    msg = r.value('error_not_found');
  }
  else if (status === 410) {
    msg = r.value('error_gone');
  }
  else if (status === 503) {
    msg = r.value('error_service_unavailable');
  }
  return msg;
}
exports.messageByHttpStatus = messageByHttpStatus;
function error(err, r, alertError) {
  var title = r.value('error');
  var msg = r.value('error_internal');
  if (!err) {
    alertError(msg, title);
    return;
  }
  var data = err && err.response ? err.response : err;
  if (data) {
    var status_1 = data.status;
    if (status_1 && !isNaN(status_1)) {
      msg = messageByHttpStatus(status_1, r);
    }
    alertError(msg, title);
  }
  else {
    alertError(msg, title);
  }
}
exports.error = error;
function getModelName(form) {
  if (form) {
    var a = form.getAttribute('model-name');
    if (a && a.length > 0) {
      return a;
    }
    var b = form.name;
    if (b) {
      if (b.endsWith('Form')) {
        return b.substr(0, b.length - 4);
      }
      return b;
    }
  }
  return '';
}
exports.getModelName = getModelName;
