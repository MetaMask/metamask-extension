type MarketIdentity = { symbol: string };
type MarketQuote = { symbol: string; price: string; timestamp?: number };

/**
 * Compare every rendered row using its stable button ID, not optional labels.
 * @param rows
 * @param markets
 * @param prices
 * @param formatPrice
 */
export function observeMarketRows(
  rows: { testId: string; displayed: string }[],
  markets: MarketIdentity[],
  prices: MarketQuote[],
  formatPrice: (price: number) => string,
) {
  return rows.map((row) => {
    const candidates = markets.filter(({ symbol }) => {
      const normalized = symbol.replace(/:/gu, '-');
      return [
        `perps-watchlist-${symbol}`,
        `explore-markets-${normalized}`,
        `market-row-${normalized}`,
      ].includes(row.testId);
    });
    const symbol = candidates.length === 1 ? candidates[0].symbol : undefined;
    const quote = prices.find((price) => symbol && price.symbol === symbol);
    const value = Number(quote?.price);
    const priced = Number(row.displayed.replace(/[^0-9.]/gu, '')) > 0;
    return {
      ...row,
      symbol,
      quote: quote ? { price: quote.price, timestamp: quote.timestamp } : null,
      priced,
      matched:
        priced &&
        Number.isFinite(value) &&
        value > 0 &&
        row.displayed === formatPrice(value),
    };
  });
}

/**
 * An unpriced row must keep the complete-row boundary pending.
 * @param rows
 */
export function allMarketRowsMatch(rows: ReturnType<typeof observeMarketRows>) {
  return rows.length > 0 && rows.every((row) => row.matched);
}
