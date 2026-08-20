import type {
  Provider,
  Quote,
  QuotesResponse,
} from '@metamask/ramps-controller';
import type { useI18nContext } from '../../../../hooks/useI18nContext';

type TranslateFn = ReturnType<typeof useI18nContext>;

export type ProviderListItem = { type: 'provider'; provider: Provider };

/**
 * Tag label for a provider row (previously used / reliability / best rate).
 *
 * @param providerId - Provider id.
 * @param matchedQuote - Quote matched to this provider, when available.
 * @param ordersProviders - Provider ids from completed orders.
 * @param t - i18n translate function.
 * @returns Localized tag, or null.
 */
export function getProviderTag(
  providerId: string,
  matchedQuote: Quote | null,
  ordersProviders: string[],
  t: TranslateFn,
): string | null {
  if (ordersProviders.includes(providerId)) {
    return t('rampsPreviouslyUsed');
  }
  if (matchedQuote?.metadata?.tags?.isMostReliable) {
    return t('rampsMostReliable');
  }
  if (matchedQuote?.metadata?.tags?.isBestRate) {
    return t('rampsBestRate');
  }
  return null;
}

type BuildProviderListItemsArgs = {
  providers: Provider[];
  quotes: QuotesResponse | null;
  quotesLoading: boolean;
  displayQuotes: boolean;
};

/**
 * Builds the ordered provider list, hiding providers without quotes once the
 * quote response settles.
 *
 * @param args - Sorting inputs.
 * @param args.providers
 * @param args.quotes
 * @param args.quotesLoading
 * @param args.displayQuotes
 * @returns Ordered list items for the provider selection UI.
 */
export function buildProviderListItems({
  providers,
  quotes,
  quotesLoading,
  displayQuotes,
}: BuildProviderListItemsArgs): ProviderListItem[] {
  if (!displayQuotes || !quotes || quotesLoading) {
    return providers.map((provider) => ({ type: 'provider', provider }));
  }

  const sortOrder =
    quotes.sorted?.find((entry) => entry.sortBy === 'reliability')?.ids ??
    quotes.sorted?.[0]?.ids;

  const providersWithQuotes = providers.filter((provider) =>
    quotes.success?.some((quote) => quote.provider === provider.id),
  );

  if (sortOrder) {
    const orderMap = new Map(sortOrder.map((id, index) => [id, index]));
    providersWithQuotes.sort(
      (a, b) =>
        (orderMap.get(a.id) ?? sortOrder.length) -
        (orderMap.get(b.id) ?? sortOrder.length),
    );
  }

  return providersWithQuotes.map((provider) => ({
    type: 'provider',
    provider,
  }));
}

/**
 * Finds the best matching quote for a provider on the provider selection page.
 *
 * Prefers quotes for the selected payment method, then any non-custom-action
 * quote for the provider.
 *
 * @param quotes - Quotes response.
 * @param providerId - Provider id.
 * @param selectedPaymentMethodId - Currently selected payment method id.
 * @returns Matched quote, or null.
 */
export function findProviderQuote(
  quotes: QuotesResponse | null,
  providerId: string,
  selectedPaymentMethodId?: string,
): Quote | null {
  if (!quotes?.success?.length) {
    return null;
  }

  const isCustomActionQuote = (quote: Quote) =>
    Boolean((quote.quote as { isCustomAction?: boolean })?.isCustomAction);

  return (
    quotes.success.find(
      (quote) =>
        quote.provider === providerId &&
        (!selectedPaymentMethodId ||
          quote.quote?.paymentMethod === selectedPaymentMethodId) &&
        !isCustomActionQuote(quote),
    ) ??
    quotes.success.find(
      (quote) => quote.provider === providerId && !isCustomActionQuote(quote),
    ) ??
    null
  );
}
