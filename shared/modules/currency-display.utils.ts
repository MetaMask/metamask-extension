export const showPrimaryCurrency = (
  isOriginalNativeSymbol: boolean,
  useNativeCurrencyAsPrimaryCurrency: boolean,
): boolean => {
  // crypto is the primary currency in this case , so we have to display it always
  if (useNativeCurrencyAsPrimaryCurrency) {
    return true;
  }
  // if the primary currency corresponds to a fiat value, check that the symbol is correct.
  if (isOriginalNativeSymbol) {
    return true;
  }

  return false;
};

export const showSecondaryCurrency = (
  isOriginalNativeSymbol: boolean,
  useNativeCurrencyAsPrimaryCurrency: boolean,
): boolean => {
  // crypto is the secondary currency in this case , so we have to display it always
  if (!useNativeCurrencyAsPrimaryCurrency) {
    return true;
  }
  // if the secondary currency corresponds to a fiat value, check that the symbol is correct.
  if (isOriginalNativeSymbol) {
    return true;
  }

  return false;
};
