import { useI18nContext } from '../../../hooks/useI18nContext';

type TranslateFunction = ReturnType<typeof useI18nContext>;

function normalizeGasInput(value: string) {
  return value.replace(',', '.');
}

export const validateGas = (
  value: string,
  t: TranslateFunction,
): string | undefined => {
  const field = t('gasLimit');
  return (
    validateValueExists(value, field, t) ||
    validateValueIsNumber(value, t) ||
    validateValueIsInteger(value, t) ||
    validateValueIsPositive(value, field, t) ||
    validateGasLimitValueIsGreaterThanMinimum(value, t) ||
    undefined
  );
};

export const validatePriorityFee = (
  value: string,
  maxFeePerGasInDec: string,
  t: TranslateFunction,
): string | undefined => {
  const field = t('priorityFee');
  return (
    validateValueExists(value, field, t) ||
    validateValueIsNumber(value, t) ||
    validateValueIsPositive(value, field, t) ||
    validatePriorityFeeValueIsLessThanMaxFeePerGas(
      value,
      maxFeePerGasInDec,
      t,
    ) ||
    undefined
  );
};

export const validateMaxBaseFee = (
  value: string,
  maxPriorityFeePerGasInDec: string,
  t: TranslateFunction,
): string | undefined => {
  const field = t('maxBaseFee');
  return (
    validateValueExists(value, field, t) ||
    validateValueIsNumber(value, t) ||
    validateValueIsPositive(value, field, t) ||
    validateMaxBaseFeeValueIsGreaterThanMaxPriorityFeePerGas(
      value,
      maxPriorityFeePerGasInDec,
      t,
    ) ||
    undefined
  );
};

export const validateGasPrice = (
  value: string,
  t: TranslateFunction,
): string | undefined => {
  const field = t('gasPrice');
  return (
    validateValueExists(value, field, t) ||
    validateValueIsNumber(value, t) ||
    validateValueIsPositive(value, field, t) ||
    undefined
  );
};

function validateMaxBaseFeeValueIsGreaterThanMaxPriorityFeePerGas(
  value: string,
  maxPriorityFeePerGasInDec: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  const normalizedMaxPriorityFeePerGasInDec = normalizeGasInput(
    maxPriorityFeePerGasInDec,
  );
  if (
    parseFloat(normalizedValue) >=
    parseFloat(normalizedMaxPriorityFeePerGasInDec)
  ) {
    return false;
  }
  return t('maxBaseFeeMustBeGreaterThanPriorityFee');
}

function validatePriorityFeeValueIsLessThanMaxFeePerGas(
  value: string,
  maxFeePerGasInDec: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  const normalizedMaxFeePerGasInDec = normalizeGasInput(maxFeePerGasInDec);
  if (parseFloat(normalizedValue) <= parseFloat(normalizedMaxFeePerGasInDec)) {
    return false;
  }
  return t('priorityFeeTooHigh');
}

function validateValueExists(
  value: string,
  field: string,
  t: TranslateFunction,
): string | false {
  if (value) {
    return false;
  }

  return t('fieldRequired', [field]);
}

function validateValueIsNumber(
  value: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  // Require at least one digit - matches numbers like "123", "123.45", ".45", "123."
  if (/^(\d+\.?\d*|\d*\.\d+)$/u.test(normalizedValue)) {
    return false;
  }
  return t('onlyNumbersAllowed');
}

function validateValueIsPositive(
  value: string,
  field: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  if (parseFloat(normalizedValue) > 0) {
    return false;
  }

  if (parseFloat(normalizedValue) === 0) {
    return t('noZeroValue', [field]);
  }

  return t('negativeValuesNotAllowed');
}

function validateGasLimitValueIsGreaterThanMinimum(
  value: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  if (parseFloat(normalizedValue) >= 21000) {
    return false;
  }
  return t('gasLimitTooLow');
}

function validateValueIsInteger(
  value: string,
  t: TranslateFunction,
): string | false {
  const normalizedValue = normalizeGasInput(value);
  if (/^\d+$/u.test(normalizedValue)) {
    return false;
  }
  return t('onlyIntegersAllowed');
}
