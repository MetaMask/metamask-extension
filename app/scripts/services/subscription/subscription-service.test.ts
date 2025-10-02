import { Messenger } from '@metamask/base-controller';
import {
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
} from '@metamask/subscription-controller';
import browser from 'webextension-polyfill';
import ExtensionPlatform from '../../platforms/extension';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { WebAuthenticator } from '../oauth/types';
import { SubscriptionService } from './subscription-service';
import { SubscriptionServiceAction } from './types';

jest.mock('../../platforms/extension');

const MOCK_REDIRECT_URI = 'https://mocked-redirect-uri';

const getRedirectUrlSpy = jest.fn().mockReturnValue(MOCK_REDIRECT_URI);

const mockWebAuthenticator: WebAuthenticator = {
  getRedirectURL: getRedirectUrlSpy,
  launchWebAuthFlow: jest.fn(),
  generateCodeVerifierAndChallenge: jest.fn(),
  generateNonce: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SubscriptionService - startSubscriptionWithCard', () => {
  beforeAll(() => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.TESTING;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should start the subscription with card', async () => {
    const rootMessenger = new Messenger<SubscriptionServiceAction, never>();
    const mockCheckoutSessionUrl = 'https://mocked-checkout-session-url';
    const mockStartShieldSubscriptionWithCard = jest.fn().mockResolvedValue({
      checkoutSessionUrl: mockCheckoutSessionUrl,
    });
    rootMessenger.registerActionHandler(
      'SubscriptionController:startShieldSubscriptionWithCard',
      mockStartShieldSubscriptionWithCard,
    );
    const mockGetSubscriptions = jest.fn();
    rootMessenger.registerActionHandler(
      'SubscriptionController:getSubscriptions',
      mockGetSubscriptions,
    );

    const messenger = rootMessenger.getRestricted({
      name: 'SubscriptionService',
      allowedActions: [
        'SubscriptionController:startShieldSubscriptionWithCard',
        'SubscriptionController:getSubscriptions',
      ],
      allowedEvents: [],
    });

    const mockPlatform = new ExtensionPlatform();

    const subscriptionService = new SubscriptionService({
      messenger,
      platform: mockPlatform,
      webAuthenticator: mockWebAuthenticator,
    });
    const mockOpenTab = jest.spyOn(mockPlatform, 'openTab');
    mockOpenTab.mockResolvedValue({
      id: 1,
    } as browser.Tabs.Tab);
    const mockAddTabUpdatedListener = jest.spyOn(
      mockPlatform,
      'addTabUpdatedListener',
    );
    mockAddTabUpdatedListener.mockImplementation(async (fn) => {
      await new Promise((r) => setTimeout(r, 200));
      await fn(1, {
        url: MOCK_REDIRECT_URI,
      });
    });
    const mockAddTabRemovedListener = jest.spyOn(
      mockPlatform,
      'addTabRemovedListener',
    );
    mockAddTabRemovedListener.mockImplementation(async (fn) => {
      await new Promise((r) => setTimeout(r, 500));
      await fn(1);
    });

    await subscriptionService.startSubscriptionWithCard({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
    });

    expect(mockStartShieldSubscriptionWithCard).toHaveBeenCalledWith({
      products: [PRODUCT_TYPES.SHIELD],
      isTrialRequested: false,
      recurringInterval: RECURRING_INTERVALS.month,
      successUrl: MOCK_REDIRECT_URI,
    });

    expect(mockGetSubscriptions).toHaveBeenCalled();

    expect(mockPlatform.openTab).toHaveBeenCalledWith({
      url: mockCheckoutSessionUrl,
    });
  });
});
