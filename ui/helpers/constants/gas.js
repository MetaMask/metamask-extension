export const GAS_FORM_ERRORS = {
  GAS_LIMIT_OUT_OF_BOUNDS: 'editGasLimitOutOfBounds',
  MAX_PRIORITY_FEE_TOO_LOW: 'editGasMaxPriorityFeeLow',
  MAX_FEE_TOO_LOW: 'editGasMaxFeeLow',
  MAX_PRIORITY_FEE_BELOW_MINIMUM: 'editGasMaxPriorityFeeBelowMinimum',
  MAX_PRIORITY_FEE_HIGH_WARNING: 'editGasMaxPriorityFeeHigh',
  MAX_FEE_HIGH_WARNING: 'editGasMaxFeeHigh',
  MAX_FEE_IMBALANCE: 'editGasMaxFeeImbalance',
  GAS_PRICE_TOO_LOW: 'editGasPriceTooLow',
};

export function getGasFormErrorText(type, t, { minimumGasLimit } = {}) {
  switch (type) {
    case GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS:
      return t('editGasLimitOutOfBounds', [minimumGasLimit]);
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW:
      return t('editGasMaxPriorityFeeLow');
    case GAS_FORM_ERRORS.MAX_FEE_TOO_LOW:
      return t('editGasMaxFeeLow');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_BELOW_MINIMUM:
      return t('editGasMaxPriorityFeeBelowMinimum');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING:
      return t('editGasMaxPriorityFeeHigh');
    case GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING:
      return t('editGasMaxFeeHigh');
    case GAS_FORM_ERRORS.MAX_FEE_IMBALANCE:
      return t('editGasMaxFeePriorityImbalance');
    case GAS_FORM_ERRORS.GAS_PRICE_TOO_LOW:
      return t('editGasPriceTooLow');
    default:
      return '';
  }
}

export const PRIORITY_LEVEL_ICON_MAP = {
  low: '🐢',
  medium: '🦊',
  high: '🦍',
  dappSuggested: '🌐',
  dappSuggestedHigh: '🌐',
  swapSuggested: '🔄',
  custom: '⚙️',
};
