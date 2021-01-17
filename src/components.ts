import {focusFirstError, readOnly} from 'form-util';
import {format, json} from 'model-formatter';
import {clone, equalAll, makeDiff, setAll, setValue, trim} from 'reflectx';
import {addParametersIntoUrl, append, buildSearchMessage, changePage, changePageSize, formatResults, getDisplayFields, handleSortEvent, initSearchable, mergeSearchModel, more, optimizeSearchModel, reset, showResults} from 'search-utilities';
import {error, getModelName, LoadingService, Locale, message, MetaModel, ResourceService, StringMap, UIService} from './core';
import {build, buildMessageFromStatusCode, createModel, handleVersion, Metadata, ResultInfo, Status} from './edit';

export const enLocale = {
  'id': 'en-US',
  'countryCode': 'US',
  'dateFormat': 'M/d/yyyy',
  'firstDayOfWeek': 1,
  'decimalSeparator': '.',
  'groupSeparator': ',',
  'decimalDigits': 2,
  'currencyCode': 'USD',
  'currencySymbol': '$',
  'currencyPattern': 0
};
export class MessageComponent {
  constructor(protected resourceService?: ResourceService) {
    if (resourceService) {
      this.resource = resourceService.resource();
    }
    this.showMessage = this.showMessage.bind(this);
    this.showError = this.showError.bind(this);
    this.hideMessage = this.hideMessage.bind(this);
  }
  resource: StringMap;
  message = '';
  alertClass = '';

  showMessage(msg: string, field?: string): void {
    this.alertClass = 'alert alert-info';
    this.message = msg;
  }
  showError(msg: string, field?: string): void {
    this.alertClass = 'alert alert-danger';
    this.message = msg;
  }
  hideMessage(field?: string): void {
    this.alertClass = '';
    this.message = '';
  }
}
export class BaseViewComponent {
  constructor(protected resourceService: ResourceService, protected getLocale?: () => Locale) {
    this.resource = resourceService.resource();
    this.currencySymbol = this.currencySymbol.bind(this);
    this.getCurrencyCode = this.getCurrencyCode.bind(this);
    this.back = this.back.bind(this);
  }
  protected includeCurrencySymbol: boolean;
  protected resource: StringMap;
  protected running: boolean;
  protected form: any;

  protected back(): void {
    window.history.back();
  }

  protected currencySymbol(): boolean {
    return this.includeCurrencySymbol;
  }

  protected getCurrencyCode(): string {
    return (this.form ? this.form.getAttribute('currency-code') : null);
  }
}

export interface ViewService<T, ID> {
  metadata?(): Metadata;
  keys?(): string[];
  load(id: ID, ctx?: any): Promise<T>;
}
export class ViewComponent<T, ID> extends BaseViewComponent {
  constructor(param: ((id: ID, ctx?: any) => Promise<T>)|ViewService<T, ID>,
      resourceService: ResourceService,
      protected showError: (msg: string, title?: string, detail?: string, callback?: () => void) => void,
      getLocale?: () => Locale,
      protected loading?: LoadingService) {
    super(resourceService, getLocale);
    if (param) {
      if (typeof param === 'function') {
        this.loadFn = param;
      } else {
        this.service = param;
        if (this.service.metadata) {
          const m = this.service.metadata();
          if (m) {
            this.metadata = m;
            const meta = build(m);
            this.keys = meta.keys;
          }
        }
      }
    }
    this.getModelName = this.getModelName.bind(this);
    const n = this.getModelName();
    this[n] = {} as any;
    this.load = this.load.bind(this);
    this.showModel = this.showModel.bind(this);
    this.getModel = this.getModel.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
  }
  protected loadFn: (id: ID, ctx?: any) => Promise<T>;
  protected service: ViewService<T, ID>;
  protected form: any;
  protected keys: string[];
  protected metadata?: Metadata;

  async load(_id: ID) {
    const id: any = _id;
    if (id && id !== '') {
      try {
        this.running = true;
        if (this.loading) {
          this.loading.showLoading();
        }
        const ctx: any = {};
        let obj: T;
        if (this.loadFn) {
          obj = await this.loadFn(id, ctx);
        } else {
          obj = await this.service.load(id, ctx);
        }
        if (obj) {
          this.showModel(obj);
        } else {
          this.handleNotFound(this.form);
        }
      } catch (err) {
        const data = (err &&  err.response) ? err.response : err;
        if (data && data.status === 404) {
          this.handleNotFound(this.form);
        } else {
          error(err, this.resourceService, this.showError);
        }
      } finally {
        this.running = false;
        if (this.loading) {
          this.loading.hideLoading();
        }
      }
    }
  }
  protected handleNotFound(form?: any): void {
    const msg = message(this.resourceService, 'error_not_found', 'error');
    if (form) {
      readOnly(form);
    }
    this.showError(msg.message, msg.title);
  }
  protected getModelName(): string {
    if (this.metadata) {
      return this.metadata.name;
    }
    const n = getModelName(this.form);
    if (!n || n.length === 0) {
      return 'model';
    }
  }
  protected showModel(model: T): void {
    const name = this.getModelName();
    this[name] = model;
  }
  getModel(): T {
    const name = this.getModelName();
    const model = this[name];
    return model;
  }
}

export class BaseComponent extends BaseViewComponent {
  constructor(resourceService: ResourceService, ui: UIService,
      getLocale?: () => Locale,
      protected loading?: LoadingService) {
    super(resourceService, getLocale);
    this.uiS1 = ui;

    this.getModelName = this.getModelName.bind(this);
    this.includes = this.includes.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStateFlat = this.updateStateFlat.bind(this);
  }
  private uiS1: UIService;
  /*
  protected init() {
    try {
      this.loadData();
    } catch (err) {
      this.handleError(err);
    }
  }

  refresh() {
    try {
      this.loadData();
    } catch (err) {
      this.handleError(err);
    }
  }
  */
  protected getModelName(): string {
    const n = getModelName(this.form);
    if (!n || n.length === 0) {
      return 'model';
    }
    // return 'state';
  }
  protected includes(checkedList: Array<string|number>, v: string|number): boolean {
    return v && checkedList &&  Array.isArray(checkedList) ? checkedList.includes(v) : false;
  }
  protected updateState(event: any) {
    let locale: Locale = enLocale;
    if (this.getLocale) {
      locale = this.getLocale();
    }
    this.updateStateFlat(event, locale);
  }
  protected updateStateFlat(e: any, locale?: Locale) {
    if (!locale) {
      locale = enLocale;
    }
    const ctrl = e.currentTarget;
    let modelName = this.getModelName();
    if (!modelName) {
      modelName = ctrl.form.getAttribute('model-name');
    }
    const type = ctrl.getAttribute('type');
    const isPreventDefault = type && (['checkbox', 'radio'].indexOf(type.toLowerCase()) >= 0 ? false : true);
    if (isPreventDefault) {
      e.preventDefault();
    }
    if (ctrl.nodeName === 'SELECT' && ctrl.value && ctrl.classList.contains('invalid')) {
      this.uiS1.removeErrorMessage(ctrl);
    }

    const ex = this[modelName];
    const dataField = ctrl.getAttribute('data-field');
    const field = (dataField ? dataField : ctrl.name);
    if (type && type.toLowerCase() === 'checkbox') {
      setValue(ex, field, this.uiS1.getValue(ctrl));
    } else {
      const v = this.uiS1.getValue(ctrl, locale);
      // tslint:disable-next-line:triple-equals
      if (ctrl.value != v) {
        setValue(ex, field, v);
      }
    }
  }
}

export interface GenericService<T, ID, R> extends ViewService<T, ID> {
  patch?(obj: T, ctx?: any): Promise<R>;
  insert(obj: T, ctx?: any): Promise<R>;
  update(obj: T, ctx?: any): Promise<R>;
  delete?(id: ID, ctx?: any): Promise<number>;
}
export class EditComponent<T, ID> extends BaseComponent {
  constructor(protected service: GenericService<T, ID, number|ResultInfo<T>>, resourceService: ResourceService,
      protected ui: UIService,
      protected showMessage: (msg: string) => void,
      protected showError: (m: string, title?: string, detail?: string, callback?: () => void) => void,
      protected confirm: (m2: string, header: string, yesCallback?: () => void, btnLeftText?: string, btnRightText?: string, noCallback?: () => void) => void,
      getLocale?: () => Locale,
      loading?: LoadingService, patchable?: boolean, backOnSaveSuccess?: boolean) {
    super(resourceService, ui, getLocale, loading);
    this.metadata = service.metadata();
    this.metamodel = build(this.metadata);
    if (patchable === false) {
      this.patchable = patchable;
    }
    if (backOnSaveSuccess === false) {
      this.backOnSuccess = backOnSaveSuccess;
    }
    this.insertSuccessMsg = resourceService.value('msg_save_success');
    this.updateSuccessMsg = resourceService.value('msg_save_success');

    this.getModelName = this.getModelName.bind(this);
    const n = this.getModelName();
    this[n] = {} as any;
    this.load = this.load.bind(this);
    this.resetState = this.resetState.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
    this.createModel = this.createModel.bind(this);
    this.formatModel = this.formatModel.bind(this);
    this.showModel = this.showModel.bind(this);
    this.getModel = this.getModel.bind(this);
    this.getRawModel = this.getRawModel.bind(this);

    this.newOnClick = this.newOnClick.bind(this);
    this.saveOnClick = this.saveOnClick.bind(this);
    this.onSave = this.onSave.bind(this);
    this.confirm = this.confirm.bind(this);
    this.validate = this.validate.bind(this);
    this.save = this.save.bind(this);
    this.succeed = this.succeed.bind(this);
    this.successMessage = this.successMessage.bind(this);
    this.save = this.save.bind(this);
    this.postSave = this.postSave.bind(this);
    this.handleDuplicateKey = this.handleDuplicateKey.bind(this);
  }
  protected metadata: Metadata;
  protected metamodel: MetaModel;

  newMode = false;
  setBack = false;
  patchable = true;
  backOnSuccess = true;
  protected orginalModel = null;

  addable = true;
  editable = true;
  deletable: boolean;

  insertSuccessMsg: string;
  updateSuccessMsg: string;

  async load(_id: ID, callback?: (m: T) => void) {
    const id: any = _id;
    if (id && id !== '') {
      const com = this;
      try {
        const obj = await this.service.load(id);
        if (!obj) {
          com.handleNotFound(com.form);
        } else {
          if (callback) {
            callback(obj);
          }
          this.resetState(false, obj, clone(obj));
        }
      } catch (err) {
        const data = (err &&  err.response) ? err.response : err;
        if (data && data.status === 404) {
          com.handleNotFound(com.form);
        } else {
          error(err, this.resourceService, this.showError);
        }
      } finally {
        com.running = false;
        if (this.loading) {
          this.loading.hideLoading();
        }
      }
    } else {
      this.resetState(true, this.createModel(), null);
    }
  }
  protected resetState(newMod: boolean, model: T, originalModel: T) {
    this.newMode = newMod;
    this.orginalModel = originalModel;
    this.formatModel(model);
    this.showModel(model);
  }
  protected handleNotFound(form?: any): void {
    const msg = message(this.resourceService, 'error_not_found', 'error');
    if (this.form) {
      readOnly(form);
    }
    this.showError(msg.message, msg.title);
  }
  protected formatModel(obj: T): void {
    let locale: Locale = enLocale;
    if (this.getLocale) {
      locale = this.getLocale();
    }
    format(obj, this.metamodel, locale, this.getCurrencyCode(), this.currencySymbol());
  }
  protected getModelName(): string {
    if (this.metadata) {
      return this.metadata.name;
    }
    const n = getModelName(this.form);
    if (!n || n.length === 0) {
      return 'model';
    }
  }
  protected showModel(model: T): void {
    const n = this.getModelName();
    this[n] = model;
  }
  getRawModel(): T {
    const name = this.getModelName();
    const model = this[name];
    return model;
  }
  getModel(): T {
    const name = this.getModelName();
    const model = this[name];
    const obj = clone(model);
    let locale: Locale = enLocale;
    if (this.getLocale) {
      locale = this.getLocale();
    }
    json(obj, this.metamodel, locale, this.getCurrencyCode());
    return obj;
  }
  protected createModel(): T {
    const metadata = this.service.metadata();
    if (metadata) {
      const obj = createModel(metadata);
      return obj;
    } else {
      const obj: any = {};
      return obj;
    }
  }

  newOnClick(event?: any): void {
    if (!this.form && event && event.target && event.target.form) {
      this.form = event.target.form;
    }
    this.resetState(true, this.createModel(), null);
    const u = this.ui;
    const f = this.form;
    setTimeout(() => {
      u.removeFormError(f);
    }, 100);
  }
  saveOnClick(event?: any, isBack?: boolean): void {
    if (!this.form && event && event.target) {
      this.form = event.target.form;
    }
    if (isBack) {
      this.onSave(isBack);
    } else {
      this.onSave(this.backOnSuccess);
    }
  }

  onSave(isBack?: boolean) {
    const r = this.resourceService;
    if (this.newMode && this.addable !== true) {
      const msg = message(r, 'error_permission_add', 'error_permission');
      this.showError(msg.message, msg.title);
      return;
    } else if (!this.newMode && this.editable !== true) {
      const msg = message(r, 'error_permission_edit', 'error_permission');
      this.showError(msg.message, msg.title);
      return;
    } else {
      if (this.running === true) {
        return;
      }
      const com = this;
      const obj = com.getModel();
      if (!this.newMode) {
        const diffObj = makeDiff(this.orginalModel, obj, this.metamodel.keys, this.metamodel.version);
        const l = Object.keys(diffObj).length;
        if (l === 0) {
          this.showMessage(r.value('msg_no_change'));
        } else {
          com.validate(obj, () => {
            const msg = message(r, 'msg_confirm_save', 'confirm', 'yes', 'no');
            this.confirm(msg.message, msg.title, () => {
              com.save(obj, diffObj, isBack);
            }, msg.no, msg.yes);
          });
        }
      } else {
        com.validate(obj, () => {
          const msg = message(r, 'msg_confirm_save', 'confirm', 'yes', 'no');
          this.confirm(msg.message, msg.title, () => {
            com.save(obj, obj, isBack);
          }, msg.no, msg.yes);
        });
      }
    }
  }
  validate(obj: T, callback: (u?: T) => void): void {
    let locale: Locale = enLocale;
    if (this.getLocale) {
      locale = this.getLocale();
    }
    const valid = this.ui.validateForm(this.form, locale);
    if (valid) {
      callback(obj);
    }
  }
  async save(obj: T, body?: T, isBack?: boolean) {
    this.running = true;
    if (this.loading) {
      this.loading.showLoading();
    }
    const isBackO = (isBack == null || isBack === undefined ? this.backOnSuccess : isBack);
    const com = this;
    try {
      const ctx: any = {};
      if (!this.newMode) {
        if (this.patchable === true && body && Object.keys(body).length > 0) {
          const result = await this.service.patch(body, ctx);
          com.postSave(result, isBackO);
        } else {
          const result = await this.service.update(obj, ctx);
          com.postSave(result, isBackO);
        }
      } else {
        trim(obj);
        const result = await this.service.insert(obj, ctx);
        com.postSave(result, isBackO);
      }
    } catch (err) {
      error(err, this.resourceService, this.showError);
    }
  }
  protected succeed(msg: string, backOnSave: boolean, result?: ResultInfo<T>): void {
    if (result) {
      const model = result.value;
      this.newMode = false;
      if (model && this.setBack === true) {
        if (!this.backOnSuccess) {
          this.resetState(false, model, clone(model));
        }
      } else {
        handleVersion(this.getRawModel(), this.metamodel.version);
      }
    } else {
      handleVersion(this.getRawModel(), this.metamodel.version);
    }
    this.successMessage(msg);
    if (backOnSave) {
      this.back();
    }
  }
  protected successMessage(msg: string) {
    this.showMessage(msg);
  }
  protected fail(result: ResultInfo<T>): void {
    const errors = result.errors;
    const f = this.form;
    const u = this.ui;
    const unmappedErrors = u.showFormError(f, errors);
    focusFirstError(f);
    if (!result.message) {
      if (errors && errors.length === 1) {
        result.message = errors[0].message;
      } else {
        result.message = u.buildErrorMessage(unmappedErrors);
      }
    }
    this.showError(result.message);
  }
  protected postSave(res: number|ResultInfo<T>, backOnSave: boolean): void {
    this.running = false;
    if (this.loading) {
      this.loading.hideLoading();
    }
    const newMod = this.newMode;
    const successMsg = (newMod ? this.insertSuccessMsg : this.updateSuccessMsg);
    const x: any = res;
    if (!isNaN(x)) {
      if (x > 0) {
        this.succeed(successMsg, backOnSave);
      } else {
        if (newMod) {
          this.handleDuplicateKey();
        } else {
          this.handleNotFound();
        }
      }
    } else {
      const result: ResultInfo<T> = x;
      if (result.status === Status.Success) {
        this.succeed(successMsg, backOnSave, result);
      } else if (result.status === Status.Error) {
        this.fail(result);
      } else if (newMod && result.status === Status.DuplicateKey) {
        this.handleDuplicateKey(result);
      } else {
        const msg = buildMessageFromStatusCode(result.status, this.resourceService);
        const r = this.resourceService;
        const title = r.value('error');
        if (msg && msg.length > 0) {
          this.showError(msg, title);
        } else if (result.message && result.message.length > 0) {
          this.showError(result.message, title);
        } else {
          this.showError(r.value('error_internal'), title);
        }
      }
    }
  }
  protected handleDuplicateKey(result?: ResultInfo<T>): void {
    const msg = message(this.resourceService, 'error_duplicate_key', 'error');
    this.showError(msg.message, msg.title);
  }
}

export interface LocaleFormatter<T> {
  format(obj: T, locale: Locale): T;
}
export interface SearchModel {
  page?: number;
  limit: number;
  firstLimit?: number;
  fields?: string[];
  sort?: string;

  keyword?: string;
  excluding?: any;
  refId?: string|number;
}
export interface SearchResult<T> {
  total?: number;
  results: T[];
  last?: boolean;
}
export interface SearchService<T, S extends SearchModel> {
  search(s: S, ctx?: any): Promise<SearchResult<T>>;
  keys?(): string[];
}
export class SearchComponent<T, S extends SearchModel> extends BaseComponent {
  constructor(param: ((s: S, ctx?: any) => Promise<SearchResult<T>>) | SearchService<T, S>,
      resourceService: ResourceService,
      protected ui: UIService,
      protected showMessage: (msg: string) => void,
      protected showError: (m: string, header?: string, detail?: string, callback?: () => void) => void,
      getLocale?: () => Locale,
      loading?: LoadingService) {
    super(resourceService, ui, getLocale, loading);
    this.state = {} as any;
    if (param) {
      if (typeof param === 'function') {
        const x: any = param;
        this.searchFn = x;
      } else {
        this.service = param;
        if (this.service.keys) {
          this.keys = this.service.keys();
        }
      }
    }
    this.showMessage = this.showMessage.bind(this);

    this.toggleFilter = this.toggleFilter.bind(this);
    this.mergeSearchModel = this.mergeSearchModel.bind(this);
    this.load = this.load.bind(this);
    this.getSearchForm = this.getSearchForm.bind(this);
    this.setSearchForm = this.setSearchForm.bind(this);

    this.setSearchModel = this.setSearchModel.bind(this);
    this.getOriginalSearchModel = this.getOriginalSearchModel.bind(this);
    this.getSearchModel = this.getSearchModel.bind(this);
    this.getDisplayFields = this.getDisplayFields.bind(this);

    this.pageSizeChanged = this.pageSizeChanged.bind(this);
    this.searchOnClick = this.searchOnClick.bind(this);

    this.resetAndSearch = this.resetAndSearch.bind(this);
    this.doSearch = this.doSearch.bind(this);
    this.search = this.search.bind(this);
    this.validateSearch = this.validateSearch.bind(this);
    this.showResults = this.showResults.bind(this);
    this.setList = this.setList.bind(this);
    this.getList = this.getList.bind(this);
    this.sort = this.sort.bind(this);
    this.showMore = this.showMore.bind(this);
    this.pageChanged = this.pageChanged.bind(this);
    this.deleteHeader = resourceService.value('msg_delete_header');
    this.deleteConfirm = resourceService.value('msg_delete_confirm');
    this.deleteFailed = resourceService.value('msg_delete_failed');
    this.pageChanged = this.pageChanged.bind(this);
  }
  protected searchFn: (s: S, ctx?: any) => Promise<SearchResult<T>>;
  protected service: SearchService<T, S>;
  // Pagination
  initPageSize = 20;
  pageSize = 20;
  pageIndex = 1;
  itemTotal: number;
  pageTotal: number;
  showPaging: boolean;
  append: boolean;
  appendMode: boolean;
  appendable: boolean;
  // Sortable
  sortField: string;
  sortType: string;
  sortTarget: any; // HTML element

  keys: string[];
  formatter: LocaleFormatter<T>;
  displayFields: string[];
  initDisplayFields: boolean;
  sequenceNo = 'sequenceNo';
  triggerSearch: boolean;
  tmpPageIndex: number;
  loadTime: Date;
  loadPage = 1;

  protected state: S;
  private list: T[];
  excluding: any;
  hideFilter: boolean;

  pageMaxSize = 7;
  pageSizes: number[] = [10, 20, 40, 60, 100, 200, 400, 1000];

  chkAll: any;
  viewable = true;
  addable = true;
  editable = true;
  approvable = true;
  deletable = true;

  deleteHeader: string;
  deleteConfirm: string;
  deleteFailed: string;

  toggleFilter(event: any): void {
    this.hideFilter = !this.hideFilter;
  }
  mergeSearchModel(obj: any, arrs?: string[]|any, b?: S): S {
    return mergeSearchModel(obj, this.pageSizes, arrs, b);
  }
  load(s: S, autoSearch: boolean): void {
    this.loadTime = new Date();
    const obj2 = initSearchable(s, this);
    this.loadPage = this.pageIndex;
    this.setSearchModel(obj2);
    const com = this;
    if (autoSearch) {
      setTimeout(() => {
        com.doSearch(true);
      }, 0);
    }
  }
  protected getModelName(): string {
    return 'state';
  }
  protected setSearchForm(form: any): void {
    this.form = form;
  }

  protected getSearchForm(): any {
    return this.form;
  }

  setSearchModel(obj: S): void {
    this.state = obj;
  }

  getSearchModel(): S {
    let locale: Locale = enLocale;
    if (this.getLocale) {
      locale = this.getLocale();
    }
    const obj2 = this.ui.decodeFromForm(this.getSearchForm(), locale, this.getCurrencyCode());
    const obj = obj2 ? obj2 : {};
    const obj3 = optimizeSearchModel(obj, this, this.getDisplayFields());
    if (this.excluding) {
      obj3.excluding = this.excluding;
    }
    if (this.keys && this.keys.length === 1) {
      const l = this.getList();
      if (l && l.length > 0) {
        const refId = l[l.length - 1][this.keys[0]];
        if (refId) {
          obj3.refId = '' + refId;
        }
      }
    }
    return obj3;
  }
  getOriginalSearchModel(): S {
    return this.state;
  }

  protected getDisplayFields(): string[] {
    if (this.displayFields) {
      return this.displayFields;
    }
    if (!this.initDisplayFields) {
      if (this.getSearchForm()) {
        this.displayFields = getDisplayFields(this.getSearchForm());
      }
      this.initDisplayFields = true;
    }
    return this.displayFields;
  }
  onPageSizeChanged(event: any): void {
    const ctrl = event.currentTarget;
    this.pageSizeChanged(Number(ctrl.value), event);
  }
  pageSizeChanged(size: number, event?: any): void {
    changePageSize(this, size);
    this.tmpPageIndex = 1;
    this.doSearch();
  }
  clearKeyworkOnClick = () => {
    this.state.keyword = '';
  }
  searchOnClick(event: any): void {
    if (event && !this.getSearchForm()) {
      this.setSearchForm(event.target.form);
    }
    this.resetAndSearch();
  }
  resetAndSearch() {
    if (this.running === true) {
      this.triggerSearch = true;
      return;
    }
    reset(this);
    this.tmpPageIndex = 1;
    this.doSearch();
  }
  doSearch(isFirstLoad?: boolean) {
    const listForm = this.getSearchForm();
    if (listForm) {
      this.ui.removeFormError(listForm);
    }
    const s: S = this.getSearchModel();
    const com = this;
    this.validateSearch(s, () => {
      if (com.running === true) {
        return;
      }
      com.running = true;
      if (this.loading) {
        this.loading.showLoading();
      }
      addParametersIntoUrl(s, isFirstLoad);
      com.search(s);
    });
  }
  async search(se: S) {
    try {
      const ctx: any =  {};
      if (this.searchFn) {
        const sr = await this.searchFn(se, ctx);
        this.showResults(se, sr);
      } else {
        const result = await this.service.search(se, ctx);
        this.showResults(se, result);
      }
    } catch (err) {
      error(err, this.resourceService, this.showError);
    } finally {
      this.running = false;
      if (this.loading) {
        this.loading.hideLoading();
      }
    }
  }
  validateSearch(se: S, callback: () => void): void {
    let valid = true;
    const listForm = this.getSearchForm();
    if (listForm) {
      let locale: Locale = enLocale;
      if (this.getLocale) {
        locale = this.getLocale();
      }
      valid = this.ui.validateForm(listForm, locale);
    }
    if (valid === true) {
      callback();
    }
  }
  searchError(response: any): void {
    this.pageIndex = this.tmpPageIndex;
    error(response, this.resourceService, this.showError);
  }
  showResults(s: SearchModel, sr: SearchResult<T>): void {
    const com = this;
    const results = sr.results;
    if (results != null && results.length > 0) {
      let locale: Locale = enLocale;
      if (this.getLocale) {
        locale = this.getLocale();
      }
      formatResults(results, this.formatter, locale, this.sequenceNo, this.pageIndex, this.pageSize, this.initPageSize);
    }
    const appendMode = com.appendMode;
    showResults(s, sr, com);
    if (!appendMode) {
      com.setList(results);
      com.tmpPageIndex = s.page;
      this.showMessage(buildSearchMessage(s, sr, this.resourceService));
    } else {
      if (this.append && s.page > 1) {
        append(this.getList(), results);
      } else {
        this.setList(results);
      }
    }
    this.running = false;
    if (this.loading) {
      this.loading.hideLoading();
    }
    if (this.triggerSearch) {
      this.triggerSearch = false;
      this.resetAndSearch();
    }
  }

  setList(results: T[]) {
    this.list = results;
  }
  getList(): T[] {
    return this.list;
  }

  chkAllOnClick(event: any, selected: string): void {
    const target = event.currentTarget;
    const isChecked = target.checked;
    const list = this.getList();
    setAll(list, selected, isChecked);
    this.handleItemOnChecked(list);
  }
  itemOnClick(event: any, selected: string): void {
    const list = this.getList();
    if (this.chkAll != null) {
      this.chkAll.checked = equalAll(list, selected, true);
    }
    this.handleItemOnChecked(list);
  }
  handleItemOnChecked(list: any[]) {
  }

  sort(event: any): void {
    handleSortEvent(event, this);
    if (!this.appendMode) {
      this.doSearch();
    } else {
      this.resetAndSearch();
    }
  }

  showMore(event?: any): void {
    this.tmpPageIndex = this.pageIndex;
    more(this);
    this.doSearch();
  }

  pageChanged(event?: any): void {
    if (this.loadTime) {
      const now = new Date();
      const d = Math.abs(this.loadTime.getTime() - now.getTime());
      if (d < 610) {
        if (event) {
          if (event.page && event.itemsPerPage && event.page !== this.loadPage) {
            changePage(this, this.loadPage, event.itemsPerPage);
          }
        }
        return;
      }
    }
    changePage(this, event.page, event.itemsPerPage);
    this.doSearch();
  }
}
