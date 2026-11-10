import { DEFAULT_BTC_CONVERSION_RATE } from '../constants';
import type { SpotPriceMock } from './api-response-types';
import priceApiMockData from './price-api.fixture.json';

export const DEFAULT_ETH_USD_PRICE = 3010;

type SpotTemplate = { sample: string; body: SpotPriceMock };

/**
 * Checks that every template has the spot-price fields the wallet reads.
 * Imported JSON is not an object literal, so fields the API adds are allowed.
 *
 * @param templates - The templates loaded from `price-api.fixture.json`.
 * @returns The same templates.
 */
function assertSpotTemplates<Templates extends Record<string, SpotTemplate>>(
  templates: Templates,
): Templates {
  return templates;
}

const templates = assertSpotTemplates(priceApiMockData.templates);

const ETH_FIXTURE_PRICES = {
  price: DEFAULT_ETH_USD_PRICE,
  high1d: DEFAULT_ETH_USD_PRICE,
  low1d: DEFAULT_ETH_USD_PRICE,
};

/**
 * Re-applies the prices E2E assertions depend on, so a shape sync can never
 * change them.
 *
 * @param templateName - Template name from `price-api.fixture.json`.
 * @param body - The template body.
 * @returns The body with fixture prices applied.
 */
function withFixturePrices(
  templateName: string,
  body: SpotPriceMock,
): SpotPriceMock {
  if (templateName === 'ethereum' || templateName === 'monad') {
    return { ...body, ...ETH_FIXTURE_PRICES };
  }
  if (templateName === 'bitcoin') {
    return { ...body, price: DEFAULT_BTC_CONVERSION_RATE };
  }
  return body;
}

type SpotMockEntry = {
  assetIds: string;
  template: keyof typeof templates;
  ids: string[];
};

/**
 * Which template answers each `assetIds` query the wallet sends.
 * Sepolia's two aliases and localhost share the Ethereum template.
 */
const SPOT_PRICE_MOCK_ENTRIES: SpotMockEntry[] = [
  {
    assetIds: 'eip155:1/slip44:60',
    template: 'ethereum',
    ids: ['eip155:1/slip44:60'],
  },
  {
    assetIds: 'eip155:11155111/slip44:60',
    template: 'ethereum',
    ids: ['eip155:11155111/slip44:60'],
  },
  {
    assetIds:
      'eip155:11155111/erc20:0x0000000000000000000000000000000000000000',
    template: 'ethereum',
    ids: [
      'eip155:11155111/erc20:0x0000000000000000000000000000000000000000',
      'eip155:11155111/slip44:60',
    ],
  },
  {
    assetIds: 'eip155:1337/slip44:1',
    template: 'ethereum',
    ids: ['eip155:1337/slip44:1'],
  },
  {
    assetIds: 'eip155:143/slip44:268435779',
    template: 'monad',
    ids: ['eip155:143/slip44:268435779'],
  },
  {
    assetIds: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501',
    template: 'solana',
    ids: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501'],
  },
  {
    assetIds: 'bip122:000000000019d6689c085ae165831e93/slip44:0',
    template: 'bitcoin',
    ids: ['bip122:000000000019d6689c085ae165831e93/slip44:0'],
  },
];

export const PRICE_API_V3_SPOT_PRICES_MOCKS = SPOT_PRICE_MOCK_ENTRIES.map(
  ({ assetIds, template, ids }) => ({
    assetIds,
    response: Object.fromEntries(
      ids.map((id) => [
        id,
        withFixturePrices(template, templates[template].body),
      ]),
    ),
  }),
);

function placeholderValue(
  value: string | number | boolean | null,
): string | number | boolean | null {
  if (typeof value === 'number') {
    return 0;
  }
  if (typeof value === 'string') {
    return '';
  }
  if (typeof value === 'boolean') {
    return false;
  }
  return null;
}

function placeholderSpotPrice(body: SpotPriceMock): SpotPriceMock {
  return Object.fromEntries(
    Object.entries(body).map(([key, value]) => [key, placeholderValue(value)]),
  ) as SpotPriceMock;
}

/**
 * Response for any `/v3/spot-prices` request no other mock answers.
 *
 * @param assetIds - The requested CAIP asset IDs.
 * @returns A zero price for each requested asset.
 */
export function buildFallbackSpotPricesResponse(
  assetIds: string[],
): Record<string, SpotPriceMock> {
  const fallback = placeholderSpotPrice(templates.ethereum.body);
  return Object.fromEntries(assetIds.map((assetId) => [assetId, fallback]));
}
