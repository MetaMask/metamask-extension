import { buildHistoricalPricesResponse } from './mock-responses';
import {
  BITCOIN_SPOT_PRICES_URL_REGEX,
  ETHEREUM_SPOT_PRICES_URL_REGEX,
  SOLANA_SPOT_PRICES_URL_REGEX,
  V3_HISTORICAL_PRICES_URL_REGEX,
} from './performance-mocks';

describe('benchmark performance mock URL coverage', () => {
  it('matches dedicated native spot-price endpoints', () => {
    expect(
      BITCOIN_SPOT_PRICES_URL_REGEX.test(
        'https://price.api.cx.metamask.io/v3/spot-prices/bitcoin',
      ),
    ).toBe(true);
    expect(
      ETHEREUM_SPOT_PRICES_URL_REGEX.test(
        'https://price.api.cx.metamask.io/v3/spot-prices/ethereum',
      ),
    ).toBe(true);
    expect(
      SOLANA_SPOT_PRICES_URL_REGEX.test(
        'https://price.api.cx.metamask.io/v3/spot-prices/solana',
      ),
    ).toBe(true);
  });

  it('matches v3 historical-prices asset paths used by the asset details page', () => {
    expect(
      V3_HISTORICAL_PRICES_URL_REGEX.test(
        'https://price.api.cx.metamask.io/v3/historical-prices/eip155:1/slip44:60?vsCurrency=usd&timePeriod=1d',
      ),
    ).toBe(true);
    expect(
      V3_HISTORICAL_PRICES_URL_REGEX.test(
        'https://price.api.cx.metamask.io/v3/historical-prices/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501?vsCurrency=usd&timePeriod=1d',
      ),
    ).toBe(true);
  });

  it('builds deterministic historical price fixtures', () => {
    expect(buildHistoricalPricesResponse()).toStrictEqual(
      buildHistoricalPricesResponse(),
    );
  });
});
