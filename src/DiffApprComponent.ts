import {clone, diff} from 'reflectx';
import {error, LoadingService, ResourceService, StringMap} from './core';

export interface DiffModel<T, ID> {
  id?: ID;
  origin?: T;
  value: T;
}
export interface DiffService<T, ID> {
  keys(): string[];
  diff(id: ID, ctx?: any): Promise<DiffModel<T, ID>>;
}

export enum Status {
  NotFound = 0,
  Success = 1,
  VersionError = 2,
  Error = 4
}
export interface ApprService<ID> {
  approve(id: ID, ctx?: any): Promise<Status>;
  reject(id: ID, ctx?: any): Promise<Status>;
}
export interface DiffApprService<T, ID> extends DiffService<T, ID>, ApprService<ID> {
}

export class DiffApprComponent<T, ID> {
  constructor(protected service: DiffApprService<T, ID>,
      protected resourceService: ResourceService,
      protected showMessage: (msg: string) => void,
      protected showError: (m: string, title?: string, detail?: string, callback?: () => void) => void,
      protected loading?: LoadingService) {
    this.resource = resourceService.resource();
    this.back = this.back.bind(this);

    this.approve = this.approve.bind(this);
    this.reject = this.reject.bind(this);
    this.format = this.format.bind(this);
    this.formatFields = this.formatFields.bind(this);
    this.load = this.load.bind(this);
    this.handleNotFound = this.handleNotFound.bind(this);
  }
  resource: StringMap;
  protected running: boolean;
  protected form: any;
  protected id: ID;
  origin = {};
  value = {};
  disabled = false;

  protected back(): void {
    window.history.back();
  }

  async load(_id: ID) {
    const x: any = _id;
    if (x && x !== '') {
      this.id = _id;
      try {
        this.running = true;
        if (this.loading) {
          this.loading.showLoading();
        }
        const ctx: any = {};
        const dobj = await this.service.diff(_id, ctx);
        if (!dobj) {
          this.handleNotFound(this.form);
        } else {
          const formatdDiff = formatDiffModel(dobj, this.formatFields);
          this.format(formatdDiff.origin, formatdDiff.value);
          this.value = formatdDiff.value;
          this.origin = formatdDiff.origin;
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
  protected handleNotFound(form?: any) {
    this.disabled = true;
    const r = this.resourceService;
    this.showError(r.value('error_not_found'), r.value('error'));
  }

  format(origin: T, value: T): void {
    const differentKeys = diff(origin, value);
    const form = this.form;
    for (const differentKey of differentKeys) {
      const y = form.querySelector('.' + differentKey);
      if (y) {
        if (y.childNodes.length === 3) {
          y.children[1].classList.add('highlight');
          y.children[2].classList.add('highlight');
        } else {
          y.classList.add('highlight');
        }
      }
    }
  }

  formatFields(value: T): T {
    return value;
  }
  async approve(event: any) {
    event.preventDefault();
    if (this.running) {
      return;
    }
    const r = this.resourceService;
    try {
      this.running = true;
      if (this.loading) {
        this.loading.showLoading();
      }
      const ctx: any = {};
      const status = await this.service.approve(this.id, ctx);
      if (status === Status.Success) {
        this.showMessage(r.value('msg_approve_success'));
      } else if (status === Status.VersionError) {
        this.showMessage(r.value('msg_approve_version_error'));
      } else if (status === Status.NotFound) {
        this.handleNotFound(this.form);
      } else {
        const title = r.value('error');
        const msg = r.value('error_internal');
        this.showError(msg, title);
      }
    } catch (err) {
      const data = (err &&  err.response) ? err.response : err;
      if (data && (data.status === 404 || data.status === 409)) {
        if (data.status === 404) {
          this.handleNotFound();
        } else {
          this.showMessage(r.value('msg_approve_version_error'));
        }
      } else {
        error(err, r, this.showError);
      }
    } finally {
      this.disabled = true;
      this.running = false;
      if (this.loading) {
        this.loading.hideLoading();
      }
    }
  }

  async reject(event: any) {
    event.preventDefault();
    if (this.running) {
      return;
    }
    const r = this.resourceService;
    try {
      this.running = true;
      if (this.loading) {
        this.loading.showLoading();
      }
      const ctx: any = {};
      const status = await this.service.reject(this.id, ctx);
      if (status === Status.Success) {
        this.showMessage(r.value('msg_reject_success'));
      } else if (status === Status.VersionError) {
        this.showMessage(r.value('msg_approve_version_error'));
      } else if (status === Status.NotFound) {
        this.handleNotFound(this.form);
      } else {
        const title = r.value('error');
        const msg = r.value('error_internal');
        this.showError(msg, title);
      }
    } catch (err) {
      const data = (err &&  err.response) ? err.response : err;
      if (data && (data.status === 404 || data.status === 409)) {
        if (data.status === 404) {
          this.handleNotFound();
        } else {
          this.showMessage(r.value('msg_approve_version_error'));
        }
      } else {
        error(err, r, this.showError);
      }
    } finally {
      this.disabled = true;
      this.running = false;
      if (this.loading) {
        this.loading.hideLoading();
      }
    }
  }
}

export function formatDiffModel<T, ID>(obj: DiffModel<T, ID>, formatFields?: (obj3: T) => T): DiffModel<T, ID> {
  if (!obj) {
    return obj;
  }
  const obj2 = clone(obj);
  if (!obj2.origin) {
    obj2.origin = {};
  } else {
    if (typeof obj2.origin === 'string') {
      obj2.origin = JSON.parse(obj2.origin);
    }
    if (formatFields && typeof obj2.origin === 'object' && !Array.isArray(obj2.origin)) {
      obj2.origin = formatFields(obj2.origin);
    }
  }
  if (!obj2.value) {
    obj2.value = {};
  } else {
    if (typeof obj2.value === 'string') {
      obj2.value = JSON.parse(obj2.value);
    }
    if (formatFields && typeof obj2.value === 'object' && !Array.isArray(obj2.value)) {
      obj2.value = formatFields(obj2.value);
    }
  }
  return obj2;
}
