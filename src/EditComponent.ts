import {focusFirstError, readOnly} from 'form-util';
import {format, json} from 'model-formatter';
import {clone, equalAll, makeDiff, setAll, setValue, trim} from 'reflectx';
import {addParametersIntoUrl, append, buildSearchMessage, changePage, changePageSize, formatResults, getDisplayFields, handleSortEvent, initSearchable, mergeSearchModel, more, optimizeSearchModel, reset, showResults} from 'search-utilities';
import {AlertService, messageByHttpStatus} from './core';
import {Locale} from './core';
import {message, ResourceService} from './core';
import {LoadingService} from './core';
import {UIService} from './core';
import {MetaModel} from './core';
import {build, buildMessageFromStatusCode, createModel, handleVersion, Metadata, ResultInfo, Status} from './edit';

export class BaseViewComponent {
  constructor(protected resourceService: ResourceService, protected getLocale: () => Locale) {
    this.resource = resourceService.resource();

    this.currencySymbol = this.currencySymbol.bind(this);
    this.getCurrencyCode = this.getCurrencyCode.bind(this);
    this.back = this.back.bind(this);
  }
  protected includeCurrencySymbol = false;
  resource: any;
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
  metadata(): Metadata;
  keys(): string[];
  load(id: ID): Promise<T>;
}

export class ViewComponent<T, ID> extends BaseViewComponent {
  constructor(protected service: ViewService<T, ID>, resourceService: ResourceService, getLocale: () => Locale, protected showError: (msg: string, title?: string) => void, protected loading?: LoadingService) {
    super(resourceService, getLocale);
    this.metadata = service.metadata();

    this.loadData = this.loadData.bind(this);
    this.getModelName = this.getModelName.bind(this);
    this.showModel = this.showModel.bind(this);
    this.getModel = this.getModel.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
  }
  protected metadata: Metadata;

  async loadData(_id: ID) {
    const id: any = _id;
    if (id && id !== '') {
      try {
        this.running = true;
        if (this.loading) {
          this.loading.showLoading();
        }
        const obj = await this.service.load(id);
        if (obj) {
          this.showModel(obj);
        } else {
          this.handleNotFound(this.form);
        }
      } catch (err) {
        this.handleError(err);
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
    if (this.form) {
      readOnly(form);
    }
    this.showError(msg.message, msg.title);
  }
  handleError(response: any): void {
    const r = this.resourceService;
    const title = r.value('error');
    let msg = r.value('error_internal');
    if (response) {
      if (response.status && !isNaN(response.status)) {
        msg = messageByHttpStatus(response.status, r);
      }
    }
    this.showError(msg, title);
  }

  protected getModelName(): string {
    return (this.metadata ? this.metadata.name : 'model');
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
  constructor(resourceService: ResourceService, ui: UIService, getLocale: () => Locale, protected showError: (m: string, title?: string) => void, protected loading?: LoadingService) {
    super(resourceService, getLocale);
    this.uiS1 = ui;

    this.getModelName = this.getModelName.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateStateFlat = this.updateStateFlat.bind(this);
    this.handleError = this.handleError.bind(this);
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
    return 'state';
  }

  protected updateState(event: any) {
    this.updateStateFlat(event, this.getLocale());
  }

  protected updateStateFlat(e: any, locale?: Locale) {
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

  handleError(response: any): void {
    this.running = false;
    if (this.loading) {
      this.loading.hideLoading();
    }

    const r = this.resourceService;
    const title = r.value('error');
    let msg = r.value('error_internal');
    if (!response) {
      this.showError(msg, title);
      return;
    }
    const status = response.status;
    if (status && !isNaN(status)) {
      msg = messageByHttpStatus(status, r);
    }
    if (status === 403) {
      msg = r.value('error_forbidden');
      readOnly(this.form);
      this.showError(msg, title);
    } else if (status === 401) {
      msg = r.value('error_unauthorized');
      readOnly(this.form);
      this.showError(msg, title);
    } else {
      this.showError(msg, title);
    }
  }
}

export interface ViewService<T, ID> {
  metadata(): Metadata;
  keys(): string[];
  load(id: ID): Promise<T>;
}

export interface GenericService<T, ID, R> extends ViewService<T, ID> {
  patch(obj: T): Promise<R>;
  insert(obj: T): Promise<R>;
  update(obj: T): Promise<R>;
  delete?(id: ID): Promise<number>;
}

export class EditComponent<T, ID> extends BaseComponent {
  constructor(protected service: GenericService<T, ID, number|ResultInfo<T>>, resourceService: ResourceService, getLocale: () => Locale,
    protected showMessage: (msg: string) => void,
    protected ui: UIService, protected alertService: AlertService, loading?: LoadingService, patchable?: boolean, backOnSaveSuccess?: boolean) {
    super(resourceService, ui, getLocale, alertService.alertError, loading);
    this.load = this.load.bind(this);
    this.resetState = this.resetState.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
    this.createModel = this.createModel.bind(this);
    this.formatModel = this.formatModel.bind(this);
    this.showModel = this.showModel.bind(this);
    this.getModelName = this.getModelName.bind(this);
    this.getModel = this.getModel.bind(this);
    this.getRawModel = this.getRawModel.bind(this);
    this.metadata = service.metadata();
    this.metamodel = build(this.metadata);

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
    if (patchable === false) {
      this.patchable = patchable;
    }
    if (backOnSaveSuccess === false) {
      this.backOnSuccess = backOnSaveSuccess;
    }
    this.insertSuccessMsg = resourceService.value('msg_save_success');
    this.updateSuccessMsg = resourceService.value('msg_save_success');
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
        if (callback) {
          callback(obj);
        }
        if (!obj) {
          com.handleNotFound(com.form);
        } else {
          this.resetState(false, obj, clone(obj));
        }
      } catch (err) {
        if (err && err.status === 404) {
          com.handleNotFound(com.form);
        } else {
          com.handleError(err);
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
    this.alertService.alertError(msg.message, msg.title);
  }
  protected formatModel(obj: T): void {
    format(obj, this.metamodel, this.getLocale(), this.getCurrencyCode(), this.currencySymbol());
  }
  protected getModelName(): string {
    return (this.metadata ? this.metadata.name : 'model');
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
    json(obj, this.metamodel, this.getLocale(), this.getCurrencyCode());
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
      this.alertService.alertError(msg.message, msg.title);
      return;
    } else if (!this.newMode && this.editable !== true) {
      const msg = message(r, 'error_permission_edit', 'error_permission');
      this.alertService.alertError(msg.message, msg.title);
      return;
    } else {
      if (this.running === true) {
        return;
      }
      const com = this;
      const obj = com.getModel();
      const diffObj = makeDiff(this.orginalModel, obj, this.metamodel.keys, this.metamodel.version);
      const l = Object.keys(diffObj).length;
      if (!this.newMode && l === 0) {
        this.showMessage(r.value('msg_no_change'));
      } else {
        com.validate(obj, () => {
          const msg = message(r, 'msg_confirm_save', 'confirm', 'yes', 'no');
          this.confirm(msg.message, msg.title, () => {
            com.save(obj, diffObj, isBack);
          }, msg.no, msg.yes);
        });
      }
    }
  }
  protected confirm(msg: string, title: string, yesCallback?: () => void, btnLeftText?: string, btnRightText?: string, noCallback?: () => void) {
    this.alertService.confirm(msg, title, yesCallback, btnLeftText, btnRightText, noCallback);
  }
  validate(obj: T, callback: (u?: T) => void): void {
    const valid = this.ui.validateForm(this.form, this.getLocale());
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
      if (!this.newMode) {
        if (this.patchable === true && body && Object.keys(body).length > 0) {
          const result = await this.service.patch(body);
          com.postSave(result, isBackO);
        } else {
          const result = await this.service.update(obj);
          com.postSave(result, isBackO);
        }
      } else {
        trim(obj);
        const result = await this.service.insert(obj);
        com.postSave(result, isBackO);
      }
    } catch (err) {
      this.handleError(err);
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
    this.alertService.alertError(result.message);
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
          this.alertService.alertError(msg, title);
        } else if (result.message && result.message.length > 0) {
          this.alertService.alertError(result.message, title);
        } else {
          this.alertService.alertError(r.value('error_internal'), title);
        }
      }
    }
  }
  protected handleDuplicateKey(result?: ResultInfo<T>): void {
    const msg = message(this.resourceService, 'error_duplicate_key', 'error');
    this.alertService.alertError(msg.message, msg.title);
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
  search(s: S): Promise<SearchResult<T>>;
}

export class SearchComponent<T, S extends SearchModel> extends BaseComponent {
  constructor(protected service: SearchService<T, S>,
      resourceService: ResourceService,
      protected ui: UIService,
      getLocale: () => Locale,
      protected showMessage: (msg: string) => void,
      protected showError: (m: string, title?: string) => void,
      loading?: LoadingService) {
    super(resourceService, ui, getLocale, showError, loading);
    this.deleteHeader = resourceService.value('msg_delete_header');
    this.deleteConfirm = resourceService.value('msg_delete_confirm');
    this.deleteFailed = resourceService.value('msg_delete_failed');
    this.pageChanged = this.pageChanged.bind(this);
  }
  // Pagination
  initPageSize = 20;
  pageSize = 20;
  pageIndex = 1;
  itemTotal: number;
  pageTotal: number;
  showPaging = false;
  append = false;
  appendMode = false;
  appendable = false;
  // Sortable
  sortField: string;
  sortType: string;
  sortTarget: any; // HTML element

  formatter: LocaleFormatter<T>;
  displayFields: any[];
  initDisplayFields = false;
  sequenceNo = 'sequenceNo';
  triggerSearch = false;
  tmpPageIndex: number;
  loadTime: Date;

  protected state: S;
  private list: any[];
  excluding: any;
  hideFilter: boolean;

  pageMaxSize = 7;
  pageSizes: number[] = [10, 20, 40, 60, 100, 200, 400, 1000];

  chkAll: any = null;
  viewable: boolean;
  addable: boolean;
  editable: boolean;
  approvable: boolean;
  deletable: boolean;

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
    this.setSearchModel(obj2);
    const com = this;
    if (autoSearch) {
      setTimeout(() => {
        com.doSearch(true);
      }, 0);
    }
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
    const obj2 = this.ui.decodeFromForm(this.getSearchForm(), this.getLocale(), this.getCurrencyCode());
    const obj = obj2 ? obj2 : {};
    const obj3 = optimizeSearchModel(obj, this, this.getDisplayFields());
    if (this.excluding) {
      obj3.excluding = this.excluding;
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
      const result = await this.service.search(se);
      this.showResults(se, result);
    } catch (err) {
      this.handleError(err);
    }
  }
  validateSearch(se: S, callback: () => void) {
    let valid = true;
    const listForm = this.getSearchForm();
    if (listForm) {
      valid = this.ui.validateForm(listForm, this.getLocale());
    }
    if (valid === true) {
      callback();
    }
  }
  searchError(response): void {
    this.pageIndex = this.tmpPageIndex;
    this.handleError(response);
  }
  showResults(s: SearchModel, sr: SearchResult<T>): void {
    const com = this;
    const results = sr.results;
    if (results != null && results.length > 0) {
      const locale = this.getLocale();
      formatResults(results, this.formatter, locale, this.sequenceNo, this.pageIndex, this.pageSize, this.initPageSize);
    }
    const appendMode = com.appendMode;
    showResults(s, sr, com);
    if (appendMode === false) {
      com.setList(results);
      com.tmpPageIndex = s.page;
      this.showMessage(buildSearchMessage(s, sr, this.resourceService));
    } else {
      if (this.append === true && s.page > 1) {
        append(this.getList(), results);
      } else {
        this.setList(results);
      }
    }
    this.running = false;
    if (this.loading) {
      this.loading.hideLoading();
    }
    if (this.triggerSearch === true) {
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
    if (this.appendMode === false) {
      this.doSearch();
    } else {
      this.resetAndSearch();
    }
  }

  showMore(): void {
    this.tmpPageIndex = this.pageIndex;
    more(this);
    this.doSearch();
  }

  pageChanged(event?: any): void {
    if (this.loadTime) {
      const now = new Date();
      const d = Math.abs(this.loadTime.getTime() - now.getTime());
      if (d < 220) {
        if (event) {
          if (event.page && event.itemsPerPage && event.page > 1) {
            event.page = 1;
            changePage(this, event.page, event.itemsPerPage);
          }
        }
        return;
      }
    }
    changePage(this, event.page, event.itemsPerPage);
    this.doSearch();
  }
}
