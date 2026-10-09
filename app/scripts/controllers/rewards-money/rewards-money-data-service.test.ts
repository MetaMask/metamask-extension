import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  type MessengerActions,
  type MessengerEvents,
  type MockAnyNamespace,
} from '@metamask/messenger';
import { ENVIRONMENT } from '../../../../shared/constants/build';
import { REWARDS_MONEY_API_URL } from '../../../../shared/constants/rewards';
import {
  RewardsMoneyAuthorizationError,
  RewardsMoneyDataService,
  RewardsMoneyHttpError,
  RewardsMoneyRebateQuoteError,
  getRewardsMoneyApiBaseUrl,
} from './rewards-money-data-service';
import type { RewardsMoneyDataServiceMessenger } from './rewards-money-data-service-types';

jest.mock('../../platforms/extension', () => {
  return jest.fn().mockImplementation(() => ({
    getVersion: jest.fn().mockReturnValue('7.50.1'),
  }));
});

jest.mock('loglevel', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

type AllActions = MessengerActions<RewardsMoneyDataServiceMessenger>;
type AllEvents = MessengerEvents<RewardsMoneyDataServiceMessenger>;
type RootMessenger = Messenger<MockAnyNamespace, AllActions, AllEvents>;

const referralMe = {
  role: 'NONE' as const,
  variant: 'NONE' as const,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  localized_text: {
    inviteTitle: 'Invite',
    inviteMessageBody: 'Body',
    inviteReferralCode: 'Code',
    inviteDecline: 'Decline',
    inviteAccept: 'Accept',
    inviteAcceptedEyebrow: 'Eyebrow',
    inviteAcceptedTitle: 'Title',
    inviteAcceptedBody: 'Body {date}',
    inviteAcceptedCloseA11y: 'Close',
    inviteAcceptedStartTrading: 'Start',
    inviteAcceptedViewRewards: 'View',
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  invite_hero: null,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  referred_by: null,
  // eslint-disable-next-line @typescript-eslint/naming-convention -- money API field
  excluded_regions: ['US'],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('RewardsMoneyDataService', () => {
  let messenger: RewardsMoneyDataServiceMessenger;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const originalEnvironment = process.env.METAMASK_ENVIRONMENT;
  const originalApiUrl = process.env.REWARDS_MONEY_API_URL;

  beforeEach(() => {
    delete process.env.REWARDS_MONEY_API_URL;
    delete process.env.METAMASK_ENVIRONMENT;

    const baseMessenger: RootMessenger = new Messenger({
      namespace: MOCK_ANY_NAMESPACE,
    });
    baseMessenger.registerActionHandler(
      'AuthenticationController:getBearerToken',
      () => Promise.resolve('token') as never,
    );
    baseMessenger.registerActionHandler(
      'PreferencesController:getState',
      () => ({ currentLocale: 'en-US' }) as never,
    );

    messenger = new Messenger<
      'RewardsMoneyDataService',
      MessengerActions<RewardsMoneyDataServiceMessenger>,
      MessengerEvents<RewardsMoneyDataServiceMessenger>,
      typeof baseMessenger
    >({
      namespace: 'RewardsMoneyDataService',
      parent: baseMessenger,
    });
    baseMessenger.delegate({
      messenger,
      actions: [
        'AuthenticationController:getBearerToken',
        'PreferencesController:getState',
      ],
    });

    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    process.env.METAMASK_ENVIRONMENT = originalEnvironment;
    if (originalApiUrl === undefined) {
      delete process.env.REWARDS_MONEY_API_URL;
    } else {
      process.env.REWARDS_MONEY_API_URL = originalApiUrl;
    }
  });

  function createService() {
    return new RewardsMoneyDataService({
      messenger,
      fetch: mockFetch,
    });
  }

  it('loads referral me with a bearer token', async () => {
    mockFetch.mockResolvedValue(jsonResponse(referralMe));
    const service = createService();

    await expect(service.getReferralMe()).resolves.toEqual(referralMe);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(`${REWARDS_MONEY_API_URL.DEV}/referral/me`);
    expect((init?.headers as Record<string, string>).Authorization).toBe(
      'Bearer token',
    );
    expect((init?.headers as Record<string, string>)['rewards-client-id']).toBe(
      'extension-7.50.1',
    );
    expect((init?.headers as Record<string, string>)['Accept-Language']).toBe(
      'en-US',
    );
  });

  it('treats 401 on referral me as an authorization failure', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ message: 'nope' }, 401));
    const service = createService();

    await expect(service.getReferralMe()).rejects.toBeInstanceOf(
      RewardsMoneyAuthorizationError,
    );
  });

  it('validates a code without a bearer token', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ success: true }));
    const service = createService();

    await expect(service.validateReferralCode('ab12')).resolves.toEqual({
      success: true,
    });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      `${REWARDS_MONEY_API_URL.DEV}/referral/validate?code=ab12`,
    );
    expect(
      (init?.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it('registers a referee and surfaces 403 body text', async () => {
    mockFetch.mockImplementation(
      async () => new Response('own referral code', { status: 403 }),
    );
    const service = createService();

    await expect(
      service.registerReferee({ code: 'AB12' }),
    ).rejects.toMatchObject({
      status: 403,
      bodyText: 'own referral code',
    });
    await expect(
      service.registerReferee({ code: 'AB12' }),
    ).rejects.toBeInstanceOf(RewardsMoneyHttpError);

    const [, init] = mockFetch.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ code: 'AB12' }));
    expect(mockFetch.mock.calls[0][0]).toBe(
      `${REWARDS_MONEY_API_URL.DEV}/wr/referral/referee`,
    );
  });

  it('uses the production base URL for production builds', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
    expect(getRewardsMoneyApiBaseUrl()).toBe(REWARDS_MONEY_API_URL.PRD);
  });

  describe('getRebateQuote', () => {
    const quote = {
      feeData: {
        metabridge: { amount: '875000', asset: { symbol: 'USDC' } },
      },
    };
    const response = {
      product: 'swaps' as const,
      eligible: true,
      rebateBips: 2000,
      reason: null,
    };

    function errorResponse(
      status: number,
      body: unknown,
      headers: Record<string, string> = {},
    ): Response {
      return new Response(JSON.stringify(body), { status, headers });
    }

    it('POSTs the body and resolves an ineligible quote', async () => {
      const ineligible = {
        product: 'perps' as const,
        eligible: false,
        rebateBips: 0,
        reason: 'NO_REBATE' as const,
      };
      mockFetch.mockResolvedValue(jsonResponse(ineligible));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).resolves.toEqual(ineligible);
    });

    it('POSTs the swaps fee leg with the bearer token', async () => {
      mockFetch.mockResolvedValue(jsonResponse(response));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'swaps', quote }),
      ).resolves.toEqual(response);

      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(`${REWARDS_MONEY_API_URL.DEV}/earnings/rebate/quote`);
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify({ product: 'swaps', quote }));
      expect((init?.headers as Record<string, string>).Authorization).toBe(
        'Bearer token',
      );
    });

    it('keeps a validation failure, a rate limit, a shed, and any other failure distinct', async () => {
      mockFetch
        .mockResolvedValueOnce(
          errorResponse(400, {
            statusCode: 400,
            message: ['trade is only accepted for perps and predict'],
            error: 'Bad Request',
          }),
        )
        .mockResolvedValueOnce(
          errorResponse(
            429,
            {
              statusCode: 429,
              reason: 'RATE_LIMITED',
              message: 'Too many requests',
            },
            { 'retry-after': '12' },
          ),
        )
        .mockResolvedValueOnce(
          errorResponse(
            503,
            {
              statusCode: 503,
              reason: 'SERVER_BUSY',
              message: 'Server busy, retry shortly',
            },
            { 'retry-after': '2' },
          ),
        )
        .mockResolvedValueOnce(new Response('boom', { status: 500 }));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'swaps', quote }),
      ).rejects.toMatchObject({
        name: 'RewardsMoneyRebateQuoteError',
        status: 400,
        failure: 'INVALID_REQUEST',
        detail: 'trade is only accepted for perps and predict',
      });
      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        status: 429,
        failure: 'RATE_LIMITED',
        detail: 'Too many requests',
        retryAfterSeconds: 12,
      });
      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        status: 503,
        failure: 'UNAVAILABLE',
        detail: 'Server busy, retry shortly',
        retryAfterSeconds: 2,
      });
      const failed = await service
        .getRebateQuote({ product: 'perps' })
        .catch((thrown: unknown) => thrown);
      expect(failed).toBeInstanceOf(RewardsMoneyRebateQuoteError);
      expect(failed).toMatchObject({
        status: 500,
        failure: 'FAILED',
        detail: undefined,
      });
    });

    it('leaves a 401 as an authorization error', async () => {
      mockFetch.mockResolvedValue(jsonResponse({}, 401));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toBeInstanceOf(RewardsMoneyAuthorizationError);
    });

    it('reads a Retry-After given as an HTTP date', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-07T12:00:00Z') });
      mockFetch.mockResolvedValue(
        errorResponse(
          429,
          { statusCode: 429, reason: 'RATE_LIMITED' },
          { 'retry-after': 'Wed, 07 Oct 2026 12:00:30 GMT' },
        ),
      );
      const service = createService();

      try {
        await expect(
          service.getRebateQuote({ product: 'perps' }),
        ).rejects.toMatchObject({
          failure: 'RATE_LIMITED',
          retryAfterSeconds: 30,
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('ignores a Retry-After that is neither seconds nor a date', async () => {
      mockFetch.mockResolvedValue(
        errorResponse(429, { statusCode: 429 }, { 'retry-after': 'soon' }),
      );
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        failure: 'RATE_LIMITED',
        retryAfterSeconds: undefined,
      });
    });

    it('falls back to the body reason when there is no message', async () => {
      mockFetch.mockResolvedValue(
        errorResponse(429, { statusCode: 429, reason: 'RATE_LIMITED' }),
      );
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        failure: 'RATE_LIMITED',
        detail: 'RATE_LIMITED',
        message: 'RATE_LIMITED',
      });
    });

    it('keeps the status when the error body is empty', async () => {
      mockFetch.mockResolvedValue(new Response('', { status: 503 }));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        failure: 'UNAVAILABLE',
        detail: undefined,
        message: 'Get rebate quote failed: 503',
      });
    });

    it('keeps the status when the error body cannot be read', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        headers: { get: () => null },
        text: async () => {
          throw new Error('stream closed');
        },
      } as unknown as Response);
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        failure: 'INVALID_REQUEST',
        detail: undefined,
      });
    });

    it.each([
      ['an array body', []],
      [
        'a missing rebateBips',
        { product: 'perps', eligible: false, reason: null },
      ],
      [
        'a string rebateBips',
        { product: 'perps', eligible: true, rebateBips: '2000', reason: null },
      ],
      [
        'a non-boolean eligible',
        { product: 'perps', eligible: 'yes', rebateBips: 2000, reason: null },
      ],
      [
        'a numeric reason',
        { product: 'perps', eligible: false, rebateBips: 0, reason: 1 },
      ],
    ])('refuses %s in a 200 as a FAILED quote', async (_label, body) => {
      mockFetch.mockResolvedValue(jsonResponse(body));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({
        name: 'RewardsMoneyRebateQuoteError',
        status: 200,
        failure: 'FAILED',
      });
    });

    it('refuses a 200 whose body is not JSON as a FAILED quote', async () => {
      mockFetch.mockResolvedValue(new Response('not-json', { status: 200 }));
      const service = createService();

      await expect(
        service.getRebateQuote({ product: 'perps' }),
      ).rejects.toMatchObject({ status: 200, failure: 'FAILED' });
    });
  });
});
