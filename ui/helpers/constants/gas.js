export const GAS_FORM_ERRORS = {
  GAS_LIMIT_TOO_LOW: 'gasLimitTooLow',
  MAX_PRIORITY_FEE_TOO_LOW: 'editGasMaxPriorityFeeLow',
  MAX_FEE_TOO_LOW: 'editGasMaxFeeLow',
};

export function getGasFormErrorText(type, t) {
  switch (type) {
    case GAS_FORM_ERRORS.GAS_LIMIT_TOO_LOW:
      return t('gasLimitTooLow');
    case GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW:
      return t('editGasMaxPriorityFeeLow');
    case GAS_FORM_ERRORS.MAX_FEE_TOO_LOW:
      return t('editGasMaxFeeLow');
    default:
      return '';
  }
}
