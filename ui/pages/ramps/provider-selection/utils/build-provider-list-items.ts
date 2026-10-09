import type {
  Provider,
  Quote,
  QuotesResponse,
} from '@metamask/ramps-controller';
import { TagSeverity } from '@metamask/design-system-react';
import type { useI18nContext } from '../../../../hooks/useI18nContext';

type TranslateFn = ReturnType<typeof useI18nContext>;

export type ProviderListItem = { type: 'provider'; provider: Provider };

export type ProviderTag = {
  label: string;
  severity: TagSeverity;
};

/**
 * Tag pills for a provider row (previously used / reliability / best rate).
 *
 * Tags are derived only from the quote displayed on the row (`matchedQuote`),
 * matching mobile's ProviderSelection, so a tag can never appear next to a
 * different quote's amount. All matching tags are returned in mobile's Quote
 * pill order so e.g. a quote that is both most reliable and best rate shows
 * both pills.
 * Severities: `Info` (blue) for previously used and most reliable,
 * `Success` (green) for best rate.
 *
 * @param providerId - Provider id.
 * @param matchedQuote - The quote displayed for the provider row.
 * @param ordersProviders - Provider ids from completed orders.
 * @param t - i18n translate function.
 * @returns Localized tags with their severities.
 */
export function getProviderTags(
  providerId: string,
  matchedQuote: Quote | null,
  ordersProviders: string[],
  t: TranslateFn,
): ProviderTag[] {
  const tags: ProviderTag[] = [];
  if (ordersProviders.includes(providerId)) {
    tags.push({ label: t('rampsPreviouslyUsed'), severity: TagSeverity.Info });
  }
  if (matchedQuote?.metadata?.tags?.isMostReliable) {
    tags.push({ label: t('rampsMostReliable'), severity: TagSeverity.Info });
  }
  if (matchedQuote?.metadata?.tags?.isBestRate) {
    tags.push({ label: t('rampsBestRate'), severity: TagSeverity.Success });
  }
  return tags;
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
 * @param options0
 * @param options0.providers
 * @param options0.quotes
 * @param options0.quotesLoading
 * @param options0.displayQuotes
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
