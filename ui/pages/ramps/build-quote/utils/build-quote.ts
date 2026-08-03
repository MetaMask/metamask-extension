import type { Quote, QuoteError } from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../../hooks/useI18nContext';

type TranslateFn = ReturnType<typeof useI18nContext>;

/**
 * Follow-up affordance rendered inline after the build-quote error copy.
 *
 * - `weeklyLimit` opens the "You've reached your weekly limit" modal.
 * - `changeProvider` sends the user to provider selection.
 */
export type QuoteErrorAction = 'weeklyLimit' | 'changeProvider';

export type DisplayedQuoteError = {
  message: string;
  action?: QuoteErrorAction;
};

type NamedSelection = {
  id: string;
  name: string;
} | null;

/** Fields used for provider quote matching. */
type QuoteSelectionItem = Pick<Quote, 'provider'>;

/** Fields used for provider quote error display. */
type QuoteErrorItem = Pick<QuoteError, 'provider' | 'error'>;

/**
 * Subset of controller QuotesResponse (`success` / `error`) used by build-quote
 * selection and error UI. Wider Quote fields are not required here.
 */
type QuotesResponseOrNull = {
  success?: Quote[];
  error?: QuoteErrorItem[];
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

/**
 * Resolves whether build-quote should keep waiting, recover via redirect, or
 * render the ready screen.
 *
 * When navigation passes an `assetId` intent, keep showing loading until the UI
 * store mirrors that selection. `setRampsSelectedToken` finishes in the
 * background before the UI Redux mirror updates, so treating a brief mismatch
 * as a failed pre-select caused an immediate redirect back to token selection
 * (appearing as a double-click). Permanent pre-select failures are handled by
 * `goToBuy` (it does not navigate when pre-select fails).
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

  // Intent navigation: wait for the UI store to catch up with background
  // pre-select. Do not redirect on mismatch — that races the state bridge.
  if (intentAssetId && !tokenStateIsSettled) {
    return 'loading';
  }

  if (tokensLoading && !selectedTokenAssetId) {
    return 'loading';
  }

  if (!selectedTokenAssetId) {
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

/**
 * Recognizes provider errors that mean the user hit a rolling purchase limit
 * rather than a per-order maximum.
 *
 * Providers only give us free-form strings on `QuoteError` (there is no error
 * code), so matching on the message is the only signal available.
 *
 * @param rawError - The provider's raw error message.
 * @returns True when the error describes a weekly / time-based limit.
 */
export function isWeeklyLimitQuoteError(rawError: string): boolean {
  return /weekly limit|time[\s-]?based limit/iu.test(rawError);
}

/**
 * Maps a failed quote into the copy shown under the amount on build-quote.
 *
 * Purpose-written copy is preferred over the provider's raw string: published
 * min/max limits win first, then a recognized weekly-limit error (which offers
 * the explanatory modal), then a generic "enter a lower amount or change
 * providers" fallback.
 * @param options0
 * @param options0.quoteFetchErrorMessage
 * @param options0.hasAmount
 * @param options0.hasSettledQuoteAmount
 * @param options0.selectedQuoteLoading
 * @param options0.hasQuoteFetchError
 * @param options0.quotesResponse
 * @param options0.selectedQuote
 * @param options0.limitMessage
 * @param options0.t
 */
export function resolveDisplayedQuoteError({
  quoteFetchErrorMessage,
  hasAmount,
  hasSettledQuoteAmount,
  selectedQuoteLoading,
  hasQuoteFetchError,
  quotesResponse,
  selectedQuote,
  limitMessage,
  t,
}: {
  quoteFetchErrorMessage: string | null;
  hasAmount: boolean;
  hasSettledQuoteAmount: boolean;
  selectedQuoteLoading: boolean;
  hasQuoteFetchError: boolean;
  quotesResponse: QuotesResponseOrNull;
  selectedQuote: QuoteSelectionItem | null;
  limitMessage: string | null;
  t: TranslateFn;
}): DisplayedQuoteError | null {
  if (quoteFetchErrorMessage) {
    return { message: quoteFetchErrorMessage };
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

  // Published provider limits describe min/max purchase precisely, so they
  // take precedence over anything the provider says in prose.
  if (limitMessage) {
    return { message: limitMessage };
  }

  if (isWeeklyLimitQuoteError(quotesResponse.error[0]?.error ?? '')) {
    return { message: t('rampsWeeklyLimitReached'), action: 'weeklyLimit' };
  }

  return {
    message: t('rampsQuoteErrorEnterLowerAmount'),
    action: 'changeProvider',
  };
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
  selectedQuote: QuoteSelectionItem | null;
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
