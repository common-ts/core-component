import {readOnly} from 'form-util';
import {setValue} from 'reflectx';
import {BaseViewComponent} from './BaseViewComponent';
import {Locale} from './core';
import {UIService} from './core';
import {LoadingService} from './core';
import {messageByHttpStatus, ResourceService} from './core';

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
