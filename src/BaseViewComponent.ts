import {ResourceService} from './core';
import {Locale} from './core';

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
    try {
      (window as any).history.back();
    } catch (err) {}
  }

  protected currencySymbol(): boolean {
    return this.includeCurrencySymbol;
  }

  protected getCurrencyCode(): string {
    return (this.form ? this.form.getAttribute('currency-code') : null);
  }
}
