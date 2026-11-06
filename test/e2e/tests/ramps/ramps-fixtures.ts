import type { MockedEndpoint, Mockttp } from 'mockttp';
import { DEFAULT_FIXTURE_ACCOUNT } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';

export const RAMPS_PROVIDER_ID = 'mockprovider-http-staging';
export const RAMPS_PROVIDER_NAME = 'Mock HTTP Provider (Staging)';
export const RAMPS_REGION = 'us-ca';
export const RAMPS_ASSET_ID = 'eip155:1/slip44:60';
export const RAMPS_PAYMENT_METHOD = 'debit-credit-card';
export const RAMPS_ORDER_CODE = 'mock-order-1';
export const RAMPS_CALLBACK_BASE =
  'https://on-ramp-content.uat-api.cx.metamask.io/regions/fake-callback';

// Must be HTTPS: the Firefox E2E driver only proxies TLS traffic
// (`network.proxy.ssl`), so an http:// mock host is never intercepted.
const RAMPS_WIDGET_URL = 'https://provider-mock.test/widget';

const country = {
  isoCode: 'US',
  flag: '🇺🇸',
  name: 'United States',
  currency: 'usd',
  supported: { buy: true, sell: true },
  phone: { prefix: '+1', placeholder: '(555) 123-4567', template: '' },
  states: [
    {
      stateId: 'CA',
      name: 'California',
      supported: { buy: true, sell: true },
    },
  ],
};

const provider = {
  id: RAMPS_PROVIDER_ID,
  name: RAMPS_PROVIDER_NAME,
  environmentType: 'staging',
  description: '',
  hqAddress: '',
  links: [],
  logos: { light: '', dark: '', height: 32, width: 96 },
};

const ethToken = {
  assetId: RAMPS_ASSET_ID,
  chainId: 'eip155:1',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  iconUrl: '',
  tokenSupported: true,
};

const paymentMethod = {
  id: RAMPS_PAYMENT_METHOD,
  paymentType: 'debit-credit-card',
  name: 'Debit or Credit',
  score: 90,
  icon: 'card',
  delay: [5, 10],
};

const quote = {
  success: [
    {
      provider: RAMPS_PROVIDER_ID,
      quote: {
        amountIn: 100,
        amountOut: '0.02814285',
        paymentMethod: RAMPS_PAYMENT_METHOD,
        amountOutInFiat: 98,
        totalFees: 1.5,
        networkFee: 0.5,
        providerFee: 1,
        buyURL: `https://on-ramp.uat-api.cx.metamask.io/providers/${RAMPS_PROVIDER_ID}/buy-widget?regionId=${RAMPS_REGION}&paymentMethodId=${RAMPS_PAYMENT_METHOD}&cryptoCurrencyId=1%2Feth&fiatCurrencyId=usd&amount=100&walletAddress=${DEFAULT_FIXTURE_ACCOUNT}&redirectUrl=${encodeURIComponent(
          RAMPS_CALLBACK_BASE,
        )}`,
      },
      metadata: {
        reliability: 95,
        tags: { isBestRate: true, isMostReliable: true },
      },
    },
  ],
  sorted: [{ sortBy: 'price', ids: [RAMPS_PROVIDER_ID] }],
  error: [],
  customActions: [],
};

const order = {
  id: `${RAMPS_PROVIDER_ID}/orders/${RAMPS_ORDER_CODE}`,
  isOnlyLink: false,
  provider,
  success: true,
  cryptoAmount: 0.02814285,
  fiatAmount: 100,
  cryptoCurrency: {
    assetId: RAMPS_ASSET_ID,
    chainId: 'eip155:1',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    iconUrl: '',
  },
  fiatCurrency: {
    id: 'usd',
    symbol: 'USD',
    name: 'US Dollar',
    decimals: 2,
    denomSymbol: '$',
  },
  paymentMethod: { id: RAMPS_PAYMENT_METHOD, name: 'Debit or Credit' },
  createdAt: 1700000000000,
  totalFeesFiat: 1.5,
  txHash: '',
  walletAddress: DEFAULT_FIXTURE_ACCOUNT,
  status: 'COMPLETED',
  network: '1',
  canBeUpdated: false,
  idHasExpired: false,
  excludeFromPurchases: false,
  timeDescriptionPending: '',
  orderType: 'BUY',
  exchangeRate: 3500,
};

const widgetHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Mock Ramp Provider</title>
  </head>
  <body>
    <a
      class="outcome-link"
      href="${RAMPS_CALLBACK_BASE}?orderId=${RAMPS_ORDER_CODE}"
    >
      Complete purchase
    </a>
  </body>
</html>`;

/**
 * Builds the extension fixture for the hermetic ramps Buy spec.
 *
 * The selected provider is seeded so the quote request targets the mocked
 * standalone provider; the mocked catalog contains only that provider.
 *
 * @returns Fixture build result.
 */
export function buildRampsFixture() {
  const fixture = new FixtureBuilderV2()
    .withRemoteFeatureFlagController({
      remoteFeatureFlags: {
        rampsEnabled: true,
      },
    })
    .build();

  const data = fixture.data as unknown as Record<string, unknown>;
  const rampsController = data.RampsController as Record<string, unknown>;

  rampsController.providerAutoSelected = false;
  rampsController.providers = {
    data: [provider],
    selected: provider,
    isLoading: false,
    error: null,
  };
  rampsController.userRegion = {
    regionCode: RAMPS_REGION,
    country,
    state: country.states[0],
  };

  return fixture;
}

/**
 * Replays the client-facing ramps contract captured from the local stack.
 * No local services are required.
 *
 * @param server - Mockttp server.
 * @returns The mocked endpoints.
 */
export async function mockRampsContract(
  server: Mockttp,
): Promise<MockedEndpoint[]> {
  return [
    await server
      .forGet(
        /https:\/\/on-ramp-cache\.uat-api\.cx\.metamask\.io\/v2\/regions\/countries/u,
      )
      .always()
      .thenJson(200, [country]),
    await server
      .forGet(
        /https:\/\/on-ramp-cache\.uat-api\.cx\.metamask\.io\/v2\/regions\/us-ca\/topTokens/u,
      )
      .always()
      .thenJson(200, { topTokens: [ethToken], allTokens: [ethToken] }),
    await server
      .forGet(
        /https:\/\/on-ramp-cache\.uat-api\.cx\.metamask\.io\/v2\/regions\/us-ca\/providers/u,
      )
      .always()
      .thenJson(200, { providers: [provider] }),
    await server
      .forGet(
        /https:\/\/on-ramp-cache\.uat-api\.cx\.metamask\.io\/v2\/regions\/us-ca\/payments/u,
      )
      .always()
      .thenJson(200, { payments: [paymentMethod] }),
    await server
      .forGet(/https:\/\/on-ramp\.uat-api\.cx\.metamask\.io\/v2\/quotes/u)
      .always()
      .thenJson(200, quote),
    await server
      .forGet(
        /https:\/\/on-ramp\.uat-api\.cx\.metamask\.io\/providers\/mockprovider-http-staging\/buy-widget/u,
      )
      .always()
      .thenJson(200, {
        url: RAMPS_WIDGET_URL,
        browser: 'APP_BROWSER',
        orderId: null,
      }),
    await server
      .forGet(/https:\/\/provider-mock\.test\/widget/u)
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        body: widgetHtml,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })),
    await server
      .forGet(
        /https:\/\/on-ramp-content\.uat-api\.cx\.metamask\.io\/regions\/fake-callback/u,
      )
      .always()
      .thenCallback(() => ({
        statusCode: 200,
        body: '<!doctype html><html><body></body></html>',
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })),
    await server
      .forGet(
        /https:\/\/on-ramp\.uat-api\.cx\.metamask\.io\/v2\/providers\/mockprovider-http-staging\/callback/u,
      )
      .always()
      .thenJson(200, {
        id: `${RAMPS_PROVIDER_ID}/orders/${RAMPS_ORDER_CODE}`,
      }),
    await server
      .forGet(
        /https:\/\/on-ramp\.uat-api\.cx\.metamask\.io\/v2\/providers\/mockprovider-http-staging\/orders\/mock-order-1/u,
      )
      .always()
      .thenJson(200, order),
  ];
}
