import {
  type AddPrecreatedOrderParams,
  type BuyWidget,
  type Country,
  type ExecuteRequestOptions,
  type GetRampsQuotesParams,
  type PaymentMethod,
  type Provider,
  type Quote,
  type QuotesResponse,
  type RampsOrder,
  RampsOrderStatus,
  type RampsQueryStatus,
  type RampsToken,
  type TokensResponse,
  type UserRegion,
} from './types';

/**
 * STUB implementation of the ramps controller data hook.
 *
 * This is a deliberate placeholder so the money-movement UI can be built on a
 * separate track while the real data layer (controller wiring, messenger, redux
 * store actions/selectors) is finalized in PRs #43962 / #43963. It returns
 * static fixture data and no-op mutators — nothing is wired to a controller.
 *
 * The exported `UseRampsControllerResult` interface is kept identical to the
 * real hook's contract, so when the data layer merges this file is replaced by
 * the real `useRampsController` with zero changes required in consuming UI.
 */
export interface UseRampsControllerResult {
  userRegion: UserRegion | null;
  setUserRegion: (
    region: string,
    options?: ExecuteRequestOptions,
  ) => Promise<UserRegion | null>;
  selectedProvider: Provider | null;
  setSelectedProvider: (
    provider: Provider | null,
    options?: { autoSelected?: boolean },
  ) => Promise<void>;
  providers: Provider[];
  providersLoading: boolean;
  providersError: string | null;
  tokens: TokensResponse | null;
  selectedToken: RampsToken | null;
  setSelectedToken: (assetId: string) => Promise<void>;
  tokensLoading: boolean;
  tokensError: string | null;
  countries: Country[];
  countriesLoading: boolean;
  countriesError: string | null;
  paymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (
    paymentMethod: PaymentMethod | null,
  ) => Promise<void>;
  paymentMethodsLoading: boolean;
  paymentMethodsFetching: boolean;
  paymentMethodsStatus: RampsQueryStatus;
  paymentMethodsError: string | null;
  getQuotes: (options: GetRampsQuotesParams) => Promise<QuotesResponse>;
  getBuyWidgetData: (quote: Quote) => Promise<BuyWidget | null>;
  orders: RampsOrder[];
  getOrderById: (providerOrderId: string) => RampsOrder | undefined;
  addOrder: (order: RampsOrder) => Promise<void>;
  addPrecreatedOrder: (params: AddPrecreatedOrderParams) => Promise<void>;
  removeOrder: (providerOrderId: string) => Promise<void>;
  refreshOrder: (
    providerCode: string,
    orderCode: string,
    wallet: string,
  ) => Promise<RampsOrder>;
  getOrderFromCallback: (
    providerCode: string,
    callbackUrl: string,
    wallet: string,
  ) => Promise<RampsOrder>;
}

// --- Stub fixture data -------------------------------------------------------

const STUB_COUNTRY: Country = {
  isoCode: 'US',
  id: '/regions/us',
  flag: '🇺🇸',
  name: 'United States',
  phone: {
    prefix: '+1',
    placeholder: '(555) 555-5555',
    template: '(###) ###-####',
  },
  currency: 'USD',
  supported: { buy: true, sell: true },
  recommended: true,
  defaultAmount: 100,
  quickAmounts: [50, 100, 250, 500],
};

const STUB_COUNTRIES: Country[] = [STUB_COUNTRY];

const STUB_USER_REGION: UserRegion = {
  country: STUB_COUNTRY,
  state: null,
  regionCode: 'us',
};

const STUB_TRANSAK: Provider = {
  id: '/providers/transak',
  name: 'Transak',
  type: 'native',
  environmentType: 'production',
  description: 'Buy crypto with card or bank transfer',
  hqAddress: 'London, UK',
  links: [{ name: 'Website', url: 'https://transak.com' }],
  logos: { light: '', dark: '', height: 24, width: 80 },
  supportedPaymentMethods: { '/payments/debit-credit-card': true },
};

const STUB_MOONPAY: Provider = {
  id: '/providers/moonpay',
  name: 'MoonPay',
  type: 'aggregator',
  environmentType: 'production',
  description: 'Fast and secure crypto purchases',
  hqAddress: 'Miami, USA',
  links: [{ name: 'Website', url: 'https://moonpay.com' }],
  logos: { light: '', dark: '', height: 24, width: 80 },
  supportedPaymentMethods: {
    '/payments/debit-credit-card': true,
    '/payments/bank-transfer': true,
  },
};

const STUB_PROVIDERS: Provider[] = [STUB_TRANSAK, STUB_MOONPAY];

const STUB_ETH: RampsToken = {
  assetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  name: 'Ether',
  symbol: 'ETH',
  decimals: 18,
  iconUrl: '',
  tokenSupported: true,
};

const STUB_USDC: RampsToken = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  chainId: 'eip155:1',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  iconUrl: '',
  tokenSupported: true,
};

const STUB_TOKENS: TokensResponse = {
  topTokens: [STUB_ETH, STUB_USDC],
  allTokens: [STUB_ETH, STUB_USDC],
};

const STUB_CARD: PaymentMethod = {
  id: '/payments/debit-credit-card',
  paymentType: 'debit-credit-card',
  name: 'Debit or Credit',
  score: 100,
  icon: 'card',
};

const STUB_BANK: PaymentMethod = {
  id: '/payments/bank-transfer',
  paymentType: 'bank-transfer',
  name: 'Bank Transfer',
  score: 80,
  icon: 'bank',
  delay: [1, 3],
};

const STUB_PAYMENT_METHODS: PaymentMethod[] = [STUB_CARD, STUB_BANK];

const STUB_QUOTES: QuotesResponse = {
  success: [
    {
      provider: '/providers/transak',
      quote: {
        amountIn: 100,
        amountOut: 0.0312,
        paymentMethod: '/payments/debit-credit-card',
        amountOutInFiat: 98,
        totalFees: 2,
        networkFee: 0.5,
        providerFee: 1.5,
        cryptoTranslation: { symbol: 'ETH', chainId: 'eip155:1' },
      },
      metadata: { reliability: 95, tags: { isBestRate: true } },
    },
    {
      provider: '/providers/moonpay',
      quote: {
        amountIn: 100,
        amountOut: 0.0309,
        paymentMethod: '/payments/debit-credit-card',
        amountOutInFiat: 97,
        totalFees: 3,
      },
      metadata: { reliability: 90, tags: { isMostReliable: true } },
    },
  ],
  sorted: [
    { sortBy: 'price', ids: ['/providers/transak', '/providers/moonpay'] },
  ],
  error: [],
  customActions: [],
};

const STUB_BUY_WIDGET: BuyWidget = {
  url: 'https://buy.example.com/widget?session=stub',
  browser: 'APP_BROWSER',
  orderId: null,
};

const STUB_ORDER: RampsOrder = {
  id: 'stub-order-1',
  isOnlyLink: false,
  provider: STUB_TRANSAK,
  success: true,
  cryptoAmount: 0.0312,
  fiatAmount: 100,
  cryptoCurrency: {
    symbol: 'ETH',
    assetId: 'eip155:1/slip44:60',
    chainId: 'eip155:1',
    decimals: 18,
  },
  fiatCurrency: { symbol: '$', name: 'US Dollar' },
  providerOrderId: '/providers/transak/orders/stub-1',
  providerOrderLink: 'https://transak.com/orders/stub-1',
  createdAt: 1719662400000,
  paymentMethod: { id: '/payments/debit-credit-card', name: 'Debit or Credit' },
  totalFeesFiat: 2,
  txHash: '',
  walletAddress: '0x0000000000000000000000000000000000000000',
  status: RampsOrderStatus.Completed,
  network: { name: 'Ethereum', chainId: 'eip155:1' },
  canBeUpdated: false,
  idHasExpired: false,
  excludeFromPurchases: false,
  timeDescriptionPending: '',
  orderType: 'buy',
};

const STUB_ORDERS: RampsOrder[] = [STUB_ORDER];

// --- Static result -----------------------------------------------------------

const STUB_RESULT: UseRampsControllerResult = {
  userRegion: STUB_USER_REGION,
  setUserRegion: async () => STUB_USER_REGION,
  selectedProvider: STUB_TRANSAK,
  setSelectedProvider: async () => undefined,
  providers: STUB_PROVIDERS,
  providersLoading: false,
  providersError: null,
  tokens: STUB_TOKENS,
  selectedToken: STUB_ETH,
  setSelectedToken: async () => undefined,
  tokensLoading: false,
  tokensError: null,
  countries: STUB_COUNTRIES,
  countriesLoading: false,
  countriesError: null,
  paymentMethods: STUB_PAYMENT_METHODS,
  selectedPaymentMethod: STUB_CARD,
  setSelectedPaymentMethod: async () => undefined,
  paymentMethodsLoading: false,
  paymentMethodsFetching: false,
  paymentMethodsStatus: 'success',
  paymentMethodsError: null,
  getQuotes: async () => STUB_QUOTES,
  getBuyWidgetData: async () => STUB_BUY_WIDGET,
  orders: STUB_ORDERS,
  getOrderById: (providerOrderId) =>
    STUB_ORDERS.find((order) => order.providerOrderId === providerOrderId),
  addOrder: async () => undefined,
  addPrecreatedOrder: async () => undefined,
  removeOrder: async () => undefined,
  refreshOrder: async () => STUB_ORDER,
  getOrderFromCallback: async () => STUB_ORDER,
};

/**
 * Returns ramps controller data and actions for the money-movement UI.
 *
 * STUB: returns static fixture data. See the file header for the swap plan.
 *
 * @returns The stubbed ramps controller result.
 */
export function useRampsController(): UseRampsControllerResult {
  return STUB_RESULT;
}

export default useRampsController;
