import { conversionUtil } from '../../../shared/modules/conversion.utils';

export function hexToDecimal(hexValue) {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  });
}

export function getTokenValueParam(tokenData = {}) {
  return tokenData?.args?._value?.toString();
}
