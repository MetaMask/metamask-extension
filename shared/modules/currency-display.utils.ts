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

type CurrencyDisplayProps = {
  useNativeCurrencyAsPrimaryCurrency: boolean;
  primaryCurrencyDisplay: string;
  showFiat: boolean;
  secondaryCurrencyDisplay: string;
  isOriginalNativeSymbol: boolean;
};

const determineCurrencyDisplay = (
  useNativeCurrencyAsPrimaryCurrency: boolean,
  showCurrency: (
    isOriginalNativeSymbol: boolean,
    useNativeCurrencyAsPrimaryCurrency: boolean,
  ) => boolean,
  displayValue: string,
  isOriginalNativeSymbol: boolean,
) => {
  return showCurrency(
    isOriginalNativeSymbol,
    useNativeCurrencyAsPrimaryCurrency,
  )
    ? displayValue
    : undefined;
};

export const getPrimaryValue = ({
  useNativeCurrencyAsPrimaryCurrency,
  primaryCurrencyDisplay,
  showFiat,
  secondaryCurrencyDisplay,
  isOriginalNativeSymbol,
}: CurrencyDisplayProps) => {
  if (useNativeCurrencyAsPrimaryCurrency) {
    return determineCurrencyDisplay(
      useNativeCurrencyAsPrimaryCurrency,
      showPrimaryCurrency,
      primaryCurrencyDisplay,
      isOriginalNativeSymbol,
    );
  }

  return showFiat
    ? determineCurrencyDisplay(
        useNativeCurrencyAsPrimaryCurrency,
        showSecondaryCurrency,
        secondaryCurrencyDisplay,
        isOriginalNativeSymbol,
      )
    : undefined;
};

export const getSecondaryValue = ({
  useNativeCurrencyAsPrimaryCurrency,
  primaryCurrencyDisplay,
  showFiat,
  secondaryCurrencyDisplay,
  isOriginalNativeSymbol,
}: CurrencyDisplayProps) => {
  if (useNativeCurrencyAsPrimaryCurrency) {
    return determineCurrencyDisplay(
      useNativeCurrencyAsPrimaryCurrency,
      showSecondaryCurrency,
      secondaryCurrencyDisplay,
      isOriginalNativeSymbol,
    );
  }

  return showFiat
    ? determineCurrencyDisplay(
        useNativeCurrencyAsPrimaryCurrency,
        showPrimaryCurrency,
        primaryCurrencyDisplay,
        isOriginalNativeSymbol,
      )
    : undefined;
};
