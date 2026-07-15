import type { Quote, QuotesResponse } from '@metamask/ramps-controller';

type NamedSelection = {
  id: string;
  name: string;
} | null;

/** Subset of controller QuotesResponse used by build-quote selection/error UI. */
type QuotesResponseOrNull = Pick<QuotesResponse, 'success' | 'error'> | null;

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

/**
 * Resolves whether build-quote should keep waiting, recover via redirect, or
 * render the ready screen.
 *
 * When navigation passes an `assetId` intent, we wait only while tokens are
 * still loading. Once loading finishes without a matching selection, redirect
 * to token selection — otherwise a failed pre-select leaves the user stuck on
 * the loading overlay forever.
 * @param options0
 * @param options0.intentAssetId
 * @param options0.selectedTokenAssetId
 * @param options0.tokensLoading
 */
export function resolveBuildQuoteViewKind({
  intentAssetId,
  selectedTokenAssetId,
  tokensLoading,
}: {
  intentAssetId: string | undefined;
  selectedTokenAssetId: string | undefined;
  tokensLoading: boolean;
}): 'loading' | 'redirect' | 'ready' {
  const tokenStateIsSettled = isTokenStateSettled(
    intentAssetId,
    selectedTokenAssetId,
  );

  if (tokensLoading && (!selectedTokenAssetId || !tokenStateIsSettled)) {
    return 'loading';
  }

  if (!selectedTokenAssetId || !tokenStateIsSettled) {
    return 'redirect';
  }

  return 'ready';
}

export function findSelectedQuote(
  quotesResponse: QuotesResponseOrNull,
  selectedProvider: NamedSelection,
  selectedPaymentMethod: NamedSelection,
): Quote | null {
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
  quotesResponse: QuotesResponseOrNull;
  selectedQuote: Quote | null;
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

/**
 * Continue is only enabled when the displayed amount has settled through the
 * quote debounce window, so users cannot proceed on a quote for a prior amount.
 * @param options0
 * @param options0.hasAmount
 * @param options0.hasSettledQuoteAmount
 * @param options0.selectedQuoteLoading
 * @param options0.selectedQuote
 * @param options0.hasQuoteFetchError
 */
export function resolveCanContinue({
  hasAmount,
  hasSettledQuoteAmount,
  selectedQuoteLoading,
  selectedQuote,
  hasQuoteFetchError,
}: {
  hasAmount: boolean;
  hasSettledQuoteAmount: boolean;
  selectedQuoteLoading: boolean;
  selectedQuote: Quote | null;
  hasQuoteFetchError: boolean;
}): boolean {
  return (
    hasAmount &&
    hasSettledQuoteAmount &&
    !selectedQuoteLoading &&
    selectedQuote !== null &&
    !hasQuoteFetchError
  );
}
