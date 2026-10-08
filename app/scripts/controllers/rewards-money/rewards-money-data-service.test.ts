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
  invite_hero: null,
  referred_by: null,
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
});
