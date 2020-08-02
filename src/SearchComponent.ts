import {equalAll, setAll} from 'reflectx';
import {addParametersIntoUrl, append, buildSearchMessage, changePage, changePageSize, formatResults, getDisplayFields, handleSortEvent, initSearchable, mergeSearchModel, more, optimizeSearchModel, reset, showResults} from 'search-utilities';
import {BaseComponent} from './BaseComponent';
import {ResourceService} from './core';
import {LoadingService} from './core';
import {Locale} from './core';
import {UIService} from './core';

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

  pageChanged(event: any): void {
    changePage(this, event.page, event.itemsPerPage);
    this.doSearch();
  }
}
