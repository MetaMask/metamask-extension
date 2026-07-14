type QuoteSuccessItem = {
  provider: string;
};

type QuotesResponse = {
  success?: QuoteSuccessItem[];
  error?: { error?: string }[];
} | null;

type NamedSelection = {
  id: string;
  name: string;
} | null;

export function parseFiatAmount(amount: string): number {
  const parsed = Number.parseFloat(amount.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function isTokenStateSettled(
  intentAssetId: string | undefined,
  selectedTokenAssetId: string | undefined,
): boolean {
  if (!intentAssetId) {
    return true;
  }

  return selectedTokenAssetId?.toLowerCase() === intentAssetId.toLowerCase();
}

export function findSelectedQuote(
  quotesResponse: QuotesResponse,
  selectedProvider: NamedSelection,
  selectedPaymentMethod: NamedSelection,
): QuoteSuccessItem | null {
  if (!quotesResponse?.success || !selectedProvider || !selectedPaymentMethod) {
    return null;
  }

  return (
    quotesResponse.success.find(
      (quote) => quote.provider === selectedProvider.id,
    ) ?? null
  );
}

export function resolvePaymentMethodLabel(
  paymentMethods: { id: string; name: string }[],
  selectedPaymentMethod: NamedSelection,
  fallbackLabel: string,
): string {
  if (!selectedPaymentMethod) {
    return paymentMethods[0]?.name ?? fallbackLabel;
  }

  const isSelectedMethodAvailable =
    paymentMethods.length === 0 ||
    paymentMethods.some((method) => method.id === selectedPaymentMethod.id);

  if (isSelectedMethodAvailable) {
    return selectedPaymentMethod.name;
  }

  return paymentMethods[0]?.name ?? fallbackLabel;
}

export function resolveDisplayedQuoteError({
  quoteFetchErrorMessage,
  hasAmount,
  hasSettledQuoteAmount,
  selectedQuoteLoading,
  hasQuoteFetchError,
  quotesResponse,
  selectedQuote,
}: {
  quoteFetchErrorMessage: string | null;
  hasAmount: boolean;
  hasSettledQuoteAmount: boolean;
  selectedQuoteLoading: boolean;
  hasQuoteFetchError: boolean;
  quotesResponse: QuotesResponse;
  selectedQuote: QuoteSuccessItem | null;
}): string | null {
  if (quoteFetchErrorMessage) {
    return quoteFetchErrorMessage;
  }

  const hasNoQuotes =
    hasAmount &&
    hasSettledQuoteAmount &&
    !selectedQuoteLoading &&
    !hasQuoteFetchError &&
    quotesResponse !== null &&
    selectedQuote === null;

  if (!hasNoQuotes || !quotesResponse?.error?.length) {
    return null;
  }

  return quotesResponse.error[0]?.error ?? null;
}
