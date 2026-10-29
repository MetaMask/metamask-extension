import {
  rampsPaymentMethodsKeys,
  rampsPaymentMethodsOptions,
} from './paymentMethods';
import { rampsProvidersKeys, rampsProvidersOptions } from './providers';
import { rampsQuotesKeys, rampsQuotesOptions } from './quotes';

export const rampsQueries = {
  paymentMethods: {
    keys: rampsPaymentMethodsKeys,
    options: rampsPaymentMethodsOptions,
  },
  providers: {
    keys: rampsProvidersKeys,
    options: rampsProvidersOptions,
  },
  quotes: {
    keys: rampsQuotesKeys,
    options: rampsQuotesOptions,
  },
};
