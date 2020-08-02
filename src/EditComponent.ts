import {focusFirstError, readOnly} from 'form-util';
import {format, json} from 'model-formatter';
import {clone, makeDiff, trim} from 'reflectx';
import {BaseComponent} from './BaseComponent';
import {AlertService} from './core';
import {Locale} from './core';
import {message, ResourceService} from './core';
import {LoadingService} from './core';
import {UIService} from './core';
import {MetaModel} from './core';
import {build, buildMessageFromStatusCode, createModel, handleVersion, Metadata, ResultInfo, Status} from './edit';

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
