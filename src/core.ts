export interface ResourceService {
  resource(): any;
  value(key: string, param?: any): string;
  format(...args: any[]): string;
}

export interface Message {
  message: string;
  title?: string;
  yes?: string;
  no?: string;
}

export function message(r: ResourceService, msg: string, title?: string, yes?: string, no?: string): Message {
  const m2 = (msg && msg.length > 0 ? r.value(msg) : '');
  const m: Message = {
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

export function messageByHttpStatus(status: number, r: ResourceService): string {
  let msg = r.value('error_internal');
  if (status === 401) {
    msg = r.value('error_unauthorized');
  } else if (status === 403) {
    msg = r.value('error_forbidden');
  } else if (status === 404) {
    msg = r.value('error_not_found');
  } else if (status === 410) {
    msg = r.value('error_gone');
  } else if (status === 503) {
    msg = r.value('error_service_unavailable');
  }
  return msg;
}

export interface Locale {
  id?: string;
  countryCode: string;
  dateFormat: string;
  firstDayOfWeek: number;
  decimalSeparator: string;
  groupSeparator: string;
  decimalDigits: number;
  currencyCode: string;
  currencySymbol: string;
  currencyPattern: number;
  currencySample?: string;
}

export interface LoadingService {
  showLoading(firstTime?: boolean): void;
  hideLoading(): void;
}

export interface ErrorMessage {
  field: string;
  code: string;
  param?: string|number|Date;
  message?: string;
}
export interface UIService {
  getValue(ctrl: any, locale?: Locale, currencyCode?: string): string|number|boolean;
  decodeFromForm(form: any, locale: Locale, currencyCode: string): any;

  validateForm(form: any, locale: Locale, focusFirst?: boolean, scroll?: boolean): boolean;
  removeFormError(form: any): void;
  removeErrorMessage(ctrl: any): void;
  showFormError(form: any, errors: ErrorMessage[], focusFirst?: boolean): ErrorMessage[];
  buildErrorMessage(errors: ErrorMessage[]): string;
}
export interface AlertService {
  confirm(msg: string, header: string, yesCallback?: () => void, btnLeftText?: string, btnRightText?: string, noCallback?: () => void): void;
  alertError(msg: string, header?: string, detail?: string, callback?: () => void): void;
}

export interface Model {
  attributes: any;
}

export interface MetaModel {
  model: Model;
  attributeName?: string;
  keys?: string[];
  dateFields?: string[];
  integerFields?: string[];
  numberFields?: string[];
  currencyFields?: string[];
  phoneFields?: string[];
  faxFields?: string[];
  objectFields?: MetaModel[];
  arrayFields?: MetaModel[];
  version?: string;
}
