import {
  PRODUCT_TYPES,
  PAYMENT_TYPES,
  Subscription,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  Env as SubscriptionEnv,
  CANCEL_TYPES,
} from '@metamask/subscription-controller';
import { getShieldGatewayConfig } from './shield';

const mockLoadShieldConfig = jest.fn();

jest.mock('./config', () => ({
  loadShieldConfig: () => mockLoadShieldConfig(),
}));

const MOCK_SUBSCRIPTION: Subscription = {
  id: 'sub_123456789',
  products: [
    {
      name: PRODUCT_TYPES.SHIELD,
      currency: 'usd',
      unitAmount: 900,
      unitDecimals: 2,
    },
  ],
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  status: SUBSCRIPTION_STATUSES.active,
  interval: RECURRING_INTERVALS.month,
  paymentMethod: {
    type: PAYMENT_TYPES.byCard,
    card: {
      brand: 'visa',
      displayBrand: 'visa',
      last4: '1234',
    },
  },
  isEligibleForSupport: true,
  cancelType: CANCEL_TYPES.ALLOWED_AT_PERIOD_END,
};

const setup = ({
  isShieldEnabled = true,
  isShieldSubscriptionActive = true,
  gatewayUrl = 'https://shield.example.com',
}: {
  isShieldEnabled?: boolean;
  isShieldSubscriptionActive?: boolean;
  gatewayUrl?: string | null;
} = {}) => {
  process.env.METAMASK_SHIELD_ENABLED = isShieldEnabled ? 'true' : 'false';

  mockLoadShieldConfig.mockReturnValue({
    subscriptionEnv: SubscriptionEnv.PRD,
    gatewayUrl: gatewayUrl ?? undefined,
    ruleEngineUrl: 'https://ruleset-engine.api.cx.metamask.io',
  });

  return {
    gatewayUrl,
    mockGetToken: jest.fn().mockResolvedValue('token'),
    mockGetShieldSubscription: jest
      .fn()
      .mockReturnValue(
        isShieldSubscriptionActive ? MOCK_SUBSCRIPTION : undefined,
      ),
    targetUrl: 'https://example.com',
  };
};

describe('getShieldGatewayConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the correct config when the feature is enabled and the subscription is active', async () => {
    const { gatewayUrl, targetUrl, mockGetToken, mockGetShieldSubscription } =
      setup();

    const config = await getShieldGatewayConfig(
      mockGetToken,
      mockGetShieldSubscription,
      targetUrl,
    );
    expect(config).toStrictEqual({
      newUrl: `${gatewayUrl}/proxy?url=${encodeURIComponent(targetUrl)}`,
      authorization: 'Bearer token',
    });
  });

  it('returns the correct config when the feature is disabled', async () => {
    const { targetUrl, mockGetToken, mockGetShieldSubscription } = setup({
      isShieldEnabled: false,
    });

    const config = await getShieldGatewayConfig(
      mockGetToken,
      mockGetShieldSubscription,
      targetUrl,
    );
    expect(config).toStrictEqual({
      newUrl: targetUrl,
      authorization: undefined,
    });
  });

  it('returns the correct config when the feature is enabled but the subscription is inactive', async () => {
    const { targetUrl, mockGetToken, mockGetShieldSubscription } = setup({
      isShieldSubscriptionActive: false,
    });

    const config = await getShieldGatewayConfig(
      mockGetToken,
      mockGetShieldSubscription,
      targetUrl,
    );
    expect(config).toStrictEqual({
      newUrl: targetUrl,
      authorization: undefined,
    });
  });

  it('returns the correct config when the token cannot be retrieved', async () => {
    const { targetUrl, mockGetToken, mockGetShieldSubscription } = setup();
    mockGetToken.mockRejectedValue(new Error('Failed to get token'));

    const config = await getShieldGatewayConfig(
      mockGetToken,
      mockGetShieldSubscription,
      targetUrl,
    );
    expect(config).toStrictEqual({
      newUrl: targetUrl,
      authorization: undefined,
    });
  });

  it('throws an error if the feature is enabled but the gateway URL is not set', async () => {
    const { targetUrl, mockGetToken, mockGetShieldSubscription } = setup({
      gatewayUrl: null,
    });

    await expect(
      getShieldGatewayConfig(
        mockGetToken,
        mockGetShieldSubscription,
        targetUrl,
      ),
    ).rejects.toThrow('Shield gateway URL is not set');
  });
});
