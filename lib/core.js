"use strict";
Object.defineProperty(exports,"__esModule",{value:true});
function message(r, msg, title, yes, no){
  var m2 = (msg && msg.length > 0 ? r.value(msg) : '');
  var m = {
    message: m2
  };
  if (title && title.length > 0){
    m.title = r.value(title);
  }
  if (yes && yes.length > 0){
    m.yes = r.value(yes);
  }
  if (no && no.length > 0){
    m.no = r.value(no);
  }
  return m;
}
exports.message = message;
function messageByHttpStatus(status, r){
  var msg = r.value('error_internal');
  if (status === 401){
    msg = r.value('error_unauthorized');
  }
  else if (status === 403){
    msg = r.value('error_forbidden');
  }
  else if (status === 404){
    msg = r.value('error_not_found');
  }
  else if (status === 410){
    msg = r.value('error_gone');
  }
  else if (status === 503){
    msg = r.value('error_service_unavailable');
  }
  return msg;
}
exports.messageByHttpStatus = messageByHttpStatus;
