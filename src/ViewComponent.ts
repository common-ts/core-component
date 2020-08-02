import {readOnly} from 'form-util';
import {BaseViewComponent} from './BaseViewComponent';
import {Locale} from './core';
import {message, messageByHttpStatus, ResourceService} from './core';
import {LoadingService} from './core';

export interface Metadata {
  name?: string;
  attributes: any;
  source?: string;
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
