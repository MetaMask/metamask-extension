import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { ENVIRONMENT } from '../../../../development/build/constants';
import { RewardsDataServiceMessenger } from '../../controller-init/messengers/reward-data-service-messenger';
import { REWARDS_API_URL } from '../../../../shared/constants/rewards';
import {
  EstimatePointsDto,
  EstimatedPointsDto,
} from '../../../../shared/types/rewards';
import {
  RewardsDataService,
  InvalidTimestampError,
  AuthorizationFailedError,
  AccountAlreadyRegisteredError,
  SeasonNotFoundError,
} from './rewards-data-service';
import type {
  LoginResponseDto,
  SeasonStateDto,
  MobileLoginDto,
  MobileOptinDto,
} from './rewards-controller.types';

// Mock ExtensionPlatform
jest.mock('../../platforms/extension', () => {
  return jest.fn().mockImplementation(() => ({
    getVersion: jest.fn().mockReturnValue('7.50.1'),
  }));
});

// Mock loglevel
jest.mock('loglevel', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}));

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

type AllActions = MessengerActions<RewardsDataServiceMessenger>;
type AllEvents = MessengerEvents<RewardsDataServiceMessenger>;

type RootMessenger = Messenger<MockAnyNamespace, AllActions, AllEvents>;

describe('RewardsDataService', () => {
  let messenger: RewardsDataServiceMessenger;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let service: RewardsDataService;
  let baseMessenger: RootMessenger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();

    // Create a new messenger for each test
    baseMessenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });

    // Register PreferencesController:getState handler
    baseMessenger.registerActionHandler(
      'PreferencesController:getState',
      () => ({ currentLocale: 'en-US' }) as never,
    );

    messenger = new Messenger<
      'RewardsDataService',
      MessengerActions<RewardsDataServiceMessenger>,
      MessengerEvents<RewardsDataServiceMessenger>,
      typeof baseMessenger
    >({
      namespace: 'RewardsDataService',
      parent: baseMessenger,
    });
    baseMessenger.delegate({
      messenger,
      actions: ['PreferencesController:getState'],
    });

    mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    // Set environment variables for testing
    delete process.env.METAMASK_ENVIRONMENT;
  });

  afterAll(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  const createService = () => {
    return new RewardsDataService({
      messenger,
      fetch: mockFetch,
    });
  };

  describe('constructor', () => {
    it('initializes with default parameters', () => {
      service = createService();
      expect(service.name).toBe('RewardsDataService');
    });

    it('uses production URL when METAMASK_ENVIRONMENT is PRODUCTION', () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
      service = createService();
      expect(service.name).toBe('RewardsDataService');
    });

    it('uses UAT URL by default when no environment is set', () => {
      service = createService();
      expect(service.name).toBe('RewardsDataService');
    });

    it('registers all action handlers', () => {
      const registerSpy = jest.spyOn(messenger, 'registerActionHandler');
      service = createService();

      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:login',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:estimatePoints',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:mobileOptin',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:getSeasonStatus',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:fetchGeoLocation',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:validateReferralCode',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:mobileJoin',
        expect.any(Function),
      );
      expect(registerSpy).toHaveBeenCalledWith(
        'RewardsDataService:getOptInStatus',
        expect.any(Function),
      );
    });
  });

  describe('locale handling', () => {
    it('retrieves locale dynamically from PreferencesController', async () => {
      service = createService();
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en-US',
          }),
        }),
      );
    });

    it('preserves locale with underscore region code format', async () => {
      // Create a new messenger with underscore format locale
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => ({ currentLocale: 'en_US' }) as never,
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en_US',
          }),
        }),
      );
    });

    it('preserves locale with hyphen region code format', async () => {
      // Create a new messenger with hyphen format locale
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => ({ currentLocale: 'en-GB' }) as never,
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en-GB',
          }),
        }),
      );
    });

    it('preserves locale with hyphen region code format (en-GB)', async () => {
      // Create a new messenger with en-GB locale
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => ({ currentLocale: 'en-GB' }) as never,
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en-GB',
          }),
        }),
      );
    });

    it('retries without normalization when first attempt fails, then falls back to en-US', async () => {
      // Create a new messenger that succeeds on retry but returns raw locale
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      let callCount = 0;
      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => {
          callCount += 1;
          if (callCount === 1) {
            throw new Error('First attempt failed');
          }
          return { currentLocale: 'de-DE' } as never;
        },
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'de-DE',
          }),
        }),
      );
      expect(callCount).toBe(2);
    });

    it('falls back to en-US when both attempts to get locale fail', async () => {
      // Create a new messenger that throws an error on both attempts
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      let callCount = 0;
      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => {
          callCount += 1;
          throw new Error('PreferencesController unavailable');
        },
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en-US',
          }),
        }),
      );
      expect(callCount).toBe(2);
    });

    it('uses different locale when PreferencesController returns different locale', async () => {
      // Create a new messenger with French locale
      const customBaseMessenger: RootMessenger = new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
      });

      customBaseMessenger.registerActionHandler(
        'PreferencesController:getState',
        () => ({ currentLocale: 'fr-FR' }) as never,
      );

      const customMessenger = new Messenger<
        'RewardsDataService',
        MessengerActions<RewardsDataServiceMessenger>,
        MessengerEvents<RewardsDataServiceMessenger>,
        typeof customBaseMessenger
      >({
        namespace: 'RewardsDataService',
        parent: customBaseMessenger,
      });
      customBaseMessenger.delegate({
        messenger: customMessenger,
        actions: ['PreferencesController:getState'],
      });

      const customService = new RewardsDataService({
        messenger: customMessenger,
        fetch: mockFetch,
      });

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await customService.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'fr-FR',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    const mockLoginRequest = {
      account: '0x123456789',
      timestamp: 1234567890,
      signature: '0xabcdef',
    };

    const mockLoginResponse: LoginResponseDto = {
      sessionId: 'test-session-id',
      subscription: {
        id: 'test-subscription-id',
        referralCode: 'test-referral-code',
        accounts: [],
      },
    };

    it('should successfully login', async () => {
      service = createService();
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockLoginResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.login(mockLoginRequest);

      expect(result).toEqual(mockLoginResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.UAT}/auth/mobile-login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockLoginRequest),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should handle login errors', async () => {
      service = createService();
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        'Login failed: 401',
      );
    });

    it('should throw AccountAlreadyRegisteredError when account is already registered (409)', async () => {
      service = createService();
      const mockResponse = {
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({
          message: 'Account is already registered',
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        AccountAlreadyRegisteredError,
      );
    });

    it('should handle network errors', async () => {
      service = createService();
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.login(mockLoginRequest)).rejects.toThrow(
        'Network error',
      );
    });

    it('should throw InvalidTimestampError when server returns invalid timestamp error', async () => {
      service = createService();
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({
          message: 'Invalid timestamp',
          serverTimestamp: 1234567000000, // Server timestamp in milliseconds
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockErrorResponse);

      try {
        await service.login(mockLoginRequest);
        fail('Expected InvalidTimestampError to be thrown');
      } catch (error) {
        expect((error as InvalidTimestampError).name).toBe(
          'InvalidTimestampError',
        );
        expect((error as InvalidTimestampError).timestamp).toBe(1234567000); // Server timestamp in seconds
      }
    });
  });

  describe('estimatePoints', () => {
    const mockEstimateRequest: EstimatePointsDto = {
      activityType: 'SWAP',
      account: 'eip155:1:0x123',
      activityContext: {
        swapContext: {
          srcAsset: { id: 'eip155:1/slip44:60', amount: '1000000000000000000' },
          destAsset: {
            id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '4500000000',
          },
          feeAsset: { id: 'eip155:1/slip44:60', amount: '5000000000000000' },
        },
      },
    };

    const mockEstimateResponse: EstimatedPointsDto = {
      pointsEstimate: 100,
      bonusBips: 500,
    };

    it('should successfully estimate points', async () => {
      service = createService();
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockEstimateResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.estimatePoints(mockEstimateRequest);

      expect(result).toEqual(mockEstimateResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/points-estimation'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockEstimateRequest),
        }),
      );
    });

    it('should handle estimate points errors', async () => {
      service = createService();
      const mockResponse = {
        ok: false,
        status: 400,
      } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.estimatePoints(mockEstimateRequest)).rejects.toThrow(
        'Points estimation failed: 400',
      );
    });
  });

  describe('mobileOptin', () => {
    const mockOptinBody: MobileOptinDto = {
      account: '0x1234567890123456789012345678901234567890',
      timestamp: 1234567890,
      signature: '0xsignature',
      referralCode: 'REF123',
    };

    const mockSubscriptionId = 'test-subscription-id';

    const mockSubscriptionResponse = {
      id: mockSubscriptionId,
      referralCode: 'test-referral-code',
      accounts: [],
    };

    const mockOptinResponse: LoginResponseDto = {
      subscription: mockSubscriptionResponse,
      sessionId: 'test-session-id',
    };

    beforeEach(() => {
      service = createService();
    });

    it('successfully opts in', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOptinResponse),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.mobileOptin(mockOptinBody);

      expect(result).toEqual(mockOptinResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/mobile-optin'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockOptinBody),
        }),
      );
    });

    it('throws InvalidTimestampError when timestamp is invalid', async () => {
      const errorData = {
        message: 'Invalid timestamp',
        serverTimestamp: 9876543210000,
      };

      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(errorData),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.mobileOptin(mockOptinBody)).rejects.toThrow(
        InvalidTimestampError,
      );
    });

    it('throws AccountAlreadyRegisteredError when account is already registered (409)', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({
          message: 'Account is already registered',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.mobileOptin(mockOptinBody)).rejects.toThrow(
        AccountAlreadyRegisteredError,
      );
    });

    it('throws error for failed optin', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.mobileOptin(mockOptinBody)).rejects.toThrow(
        'Optin failed: 500',
      );
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.mobileOptin(mockOptinBody)).rejects.toThrow(
        'Network error',
      );
    });
  });

  const mockSeasonStateResponse: SeasonStateDto = {
    balance: 1500,
    currentTierId: 'tier-1',
    updatedAt: new Date('2023-12-01T10:00:00Z'),
  };

  describe('getSeasonStatus', () => {
    const mockSeasonId = 'season-123';
    const mockSubscriptionId = 'subscription-456';

    beforeEach(() => {
      service = createService();
      // Mock successful fetch response for season state
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          balance: mockSeasonStateResponse.balance,
          currentTierId: mockSeasonStateResponse.currentTierId,
          updatedAt: '2023-12-01T10:00:00Z', // API returns string, not Date
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);
    });

    it('should successfully get season state', async () => {
      const result = await service.getSeasonStatus(
        mockSeasonId,
        mockSubscriptionId,
      );

      expect(result).toEqual(mockSeasonStateResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.UAT}/seasons/${mockSeasonId}/state`,
        {
          credentials: 'omit',
          method: 'GET',
          headers: {
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
            'rewards-access-token': mockSubscriptionId,
            'rewards-client-id': 'extension-7.50.1',
          },
          signal: expect.any(AbortSignal),
        },
      );
    });

    it('should convert date strings to Date objects', async () => {
      const result = await service.getSeasonStatus(
        mockSeasonId,
        mockSubscriptionId,
      );

      // Check updatedAt
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.updatedAt?.getTime()).toBe(
        new Date('2023-12-01T10:00:00Z').getTime(),
      );
    });

    it('should throw error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ message: 'Not found' }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.getSeasonStatus(mockSeasonId, mockSubscriptionId),
      ).rejects.toThrow('Get season state failed: 404');
    });

    it('should throw AuthorizationFailedError when rewards authorization fails', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({
          message: 'Rewards authorization failed',
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      let caughtError: unknown;
      try {
        await service.getSeasonStatus(mockSeasonId, mockSubscriptionId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(AuthorizationFailedError);
      const authError = caughtError as AuthorizationFailedError;
      expect(authError.name).toBe('AuthorizationFailedError');
      expect(authError.message).toBe(
        'Rewards authorization failed. Please login and try again.',
      );
    });

    it('should detect authorization failure when message contains the phrase', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: jest.fn().mockResolvedValue({
          message:
            'Some other error: Rewards authorization failed due to expiry',
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.getSeasonStatus(mockSeasonId, mockSubscriptionId),
      ).rejects.toBeInstanceOf(AuthorizationFailedError);
    });

    it('should throw SeasonNotFoundError when season is not found', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          message: 'Season not found',
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      let caughtError: unknown;
      try {
        await service.getSeasonStatus(mockSeasonId, mockSubscriptionId);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(SeasonNotFoundError);
      const seasonNotFoundError = caughtError as SeasonNotFoundError;
      expect(seasonNotFoundError.name).toBe('SeasonNotFoundError');
      expect(seasonNotFoundError.message).toBe(
        'Season not found. Please try again with a different season.',
      );
    });

    it('should detect season not found when message contains the phrase', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({
          message: 'The requested Season not found in the system',
        }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.getSeasonStatus(mockSeasonId, mockSubscriptionId),
      ).rejects.toBeInstanceOf(SeasonNotFoundError);
    });

    it('should throw error when fetch fails', async () => {
      const fetchError = new Error('Network error');
      mockFetch.mockRejectedValue(fetchError);

      await expect(
        service.getSeasonStatus(mockSeasonId, mockSubscriptionId),
      ).rejects.toThrow('Network error');
    });
  });

  describe('fetchGeoLocation', () => {
    beforeEach(() => {
      service = createService();
    });

    it('successfully fetches geolocation', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('US'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.fetchGeoLocation();

      expect(result).toBe('US');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://on-ramp.api.cx.metamask.io/geolocation',
      );
    });

    it('returns UNKNOWN for failed request', async () => {
      const mockResponse = {
        ok: false,
        text: jest.fn(),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.fetchGeoLocation();

      expect(result).toBe('UNKNOWN');
    });

    it('returns location string with region code', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('CA-ON'),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.fetchGeoLocation();

      expect(result).toBe('CA-ON');
    });
  });

  describe('validateReferralCode', () => {
    const mockCode = 'REF123';

    beforeEach(() => {
      service = createService();
    });

    it('successfully validates referral code', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.validateReferralCode(mockCode);

      expect(result).toEqual({ valid: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/referral/validate?code=${mockCode}`),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('returns invalid for invalid code', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: false }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.validateReferralCode(mockCode);

      expect(result).toEqual({ valid: false });
    });

    it('throws error for failed validation', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.validateReferralCode(mockCode)).rejects.toThrow(
        'Failed to validate referral code. Please try again shortly.',
      );
    });

    it('encodes special characters in referral code', async () => {
      const codeWithSpecialChars = 'REF#123&test';
      const encodedCode = encodeURIComponent(codeWithSpecialChars);

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode(codeWithSpecialChars);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/referral/validate?code=${encodedCode}`),
        expect.any(Object),
      );
    });
  });

  describe('getOptInStatus', () => {
    const mockOptInStatusRequest = {
      addresses: ['0x123456789', '0x987654321', '0xabcdefabc'],
    };

    const mockOptInStatusResponse = {
      ois: [true, false, true],
      sids: ['sub_123', null, 'sub_456'],
    };

    beforeEach(() => {
      service = createService();
    });

    it('should successfully get opt-in status for multiple addresses', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOptInStatusResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getOptInStatus(mockOptInStatusRequest);

      // Assert
      expect(result).toEqual(mockOptInStatusResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.UAT}/public/rewards/ois`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockOptInStatusRequest),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'rewards-client-id': 'extension-7.50.1',
          }),
        }),
      );
    });

    it('should successfully handle single address', async () => {
      // Arrange
      const singleAddressRequest = {
        addresses: ['0x123456789'],
      };
      const singleAddressResponse = {
        ois: [true],
        sids: ['sub_123'],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(singleAddressResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getOptInStatus(singleAddressRequest);

      // Assert
      expect(result).toEqual(singleAddressResponse);
      expect(result.ois).toHaveLength(1);
      expect(result.ois[0]).toBe(true);
    });

    it('should handle all false opt-in status', async () => {
      // Arrange
      const allFalseResponse = {
        ois: [false, false, false],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(allFalseResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getOptInStatus(mockOptInStatusRequest);

      // Assert
      expect(result).toEqual(allFalseResponse);
      expect(result.ois.every((status) => status === false)).toBe(true);
    });

    it('should handle mixed opt-in status results', async () => {
      // Arrange
      const mixedResponse = {
        ois: [true, false, true, false, true],
      };
      const mixedRequest = {
        addresses: ['0x1', '0x2', '0x3', '0x4', '0x5'],
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mixedResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getOptInStatus(mixedRequest);

      // Assert
      expect(result).toEqual(mixedResponse);
      expect(result.ois).toHaveLength(5);
      expect(result.ois[0]).toBe(true);
      expect(result.ois[1]).toBe(false);
      expect(result.ois[2]).toBe(true);
      expect(result.ois[3]).toBe(false);
      expect(result.ois[4]).toBe(true);
    });

    it('should throw error when addresses array is empty', async () => {
      // Arrange
      const emptyRequest = {
        addresses: [],
      };

      // Act & Assert
      await expect(service.getOptInStatus(emptyRequest)).rejects.toThrow(
        'Addresses are required',
      );
    });

    it('should throw error when addresses is null', async () => {
      // Arrange
      const nullRequest = {
        addresses: null as unknown as string[],
      };

      // Act & Assert
      await expect(service.getOptInStatus(nullRequest)).rejects.toThrow(
        'Addresses are required',
      );
    });

    it('should throw error when addresses exceeds maximum limit', async () => {
      // Arrange
      const tooManyAddresses = Array.from({ length: 501 }, (_, i) => `0x${i}`);
      const oversizedRequest = {
        addresses: tooManyAddresses,
      };

      // Act & Assert
      await expect(service.getOptInStatus(oversizedRequest)).rejects.toThrow(
        'Addresses must be less than 500',
      );
    });

    it('should handle exactly 500 addresses', async () => {
      // Arrange
      const maxAddresses = Array.from({ length: 500 }, (_, i) => `0x${i}`);
      const maxRequest = {
        addresses: maxAddresses,
      };
      const maxResponse = {
        ois: Array.from({ length: 500 }, (_, i) => i % 2 === 0),
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(maxResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getOptInStatus(maxRequest);

      // Assert
      expect(result).toEqual(maxResponse);
      expect(result.ois).toHaveLength(500);
    });

    it('should handle get opt-in status errors', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 400,
      } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(
        service.getOptInStatus(mockOptInStatusRequest),
      ).rejects.toThrow('Get opt-in status failed: 400');
    });

    it('should handle server errors', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 500,
      } as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(
        service.getOptInStatus(mockOptInStatusRequest),
      ).rejects.toThrow('Get opt-in status failed: 500');
    });

    it('should handle network errors during fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(
        service.getOptInStatus(mockOptInStatusRequest),
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      // Arrange
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      // Act & Assert
      await expect(
        service.getOptInStatus(mockOptInStatusRequest),
      ).rejects.toThrow('Request timeout after 10000ms');
    });

    it('should include proper headers in request', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOptInStatusResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await service.getOptInStatus(mockOptInStatusRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept-Language': 'en-US',
            'Content-Type': 'application/json',
            'rewards-client-id': 'extension-7.50.1',
          }),
        }),
      );
    });

    it('should include abort signal for timeout handling', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockOptInStatusResponse),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await service.getOptInStatus(mockOptInStatusRequest);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });
  });

  describe('timeout handling', () => {
    beforeEach(() => {
      service = createService();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('aborts request after timeout', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              const error = new Error('AbortError');
              error.name = 'AbortError';
              reject(error);
            }, 11000);
          }),
      );

      const loginPromise = service.login({
        account: '0x123',
        timestamp: 123,
        signature: '0xsig',
      });

      jest.advanceTimersByTime(11000);

      await expect(loginPromise).rejects.toThrow(
        'Request timeout after 10000ms',
      );
    });
  });

  describe('API URL configuration', () => {
    it('uses production URL for production environment', async () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
      service = createService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(REWARDS_API_URL.PRD),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.PRD}/referral/validate?code=TEST`,
        expect.any(Object),
      );
    });

    it('uses production URL for release candidate environment', async () => {
      process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;
      service = createService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(REWARDS_API_URL.PRD),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.PRD}/referral/validate?code=TEST`,
        expect.any(Object),
      );
    });

    it('uses UAT URL for non-production environments', async () => {
      delete process.env.METAMASK_ENVIRONMENT;
      service = createService();

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;
      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(REWARDS_API_URL.UAT),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        `${REWARDS_API_URL.UAT}/referral/validate?code=TEST`,
        expect.any(Object),
      );
    });
  });

  describe('custom error classes', () => {
    it('InvalidTimestampError contains timestamp', () => {
      const timestamp = 1234567890;
      const error = new InvalidTimestampError('Invalid timestamp', timestamp);

      expect(error.name).toBe('InvalidTimestampError');
      expect(error.timestamp).toBe(timestamp);
      expect(error.message).toBe('Invalid timestamp');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InvalidTimestampError);
    });

    it('AuthorizationFailedError has correct name', () => {
      const error = new AuthorizationFailedError('Authorization failed');

      expect(error.name).toBe('AuthorizationFailedError');
      expect(error.message).toBe('Authorization failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthorizationFailedError);
    });

    it('AccountAlreadyRegisteredError has correct name', () => {
      const error = new AccountAlreadyRegisteredError(
        'Account is already registered',
      );

      expect(error.name).toBe('AccountAlreadyRegisteredError');
      expect(error.message).toBe('Account is already registered');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AccountAlreadyRegisteredError);
    });
  });

  describe('request headers', () => {
    beforeEach(() => {
      service = createService();
    });

    it('includes all required headers', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'rewards-client-id': 'extension-7.50.1',
            'Accept-Language': 'en-US',
          }),
          credentials: 'omit',
        }),
      );
    });

    it('includes subscription token when provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await service.getSeasonStatus('season-1', 'token123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'rewards-access-token': 'token123',
          }),
        }),
      );
    });

    it('does not include subscription token when not provided', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ valid: true }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await service.validateReferralCode('TEST');

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1]?.headers as Record<string, string>;

      expect(headers['rewards-access-token']).toBeUndefined();
    });
  });

  describe('mobileJoin', () => {
    const mockMobileJoinBody: MobileLoginDto = {
      account: '0x1234567890123456789012345678901234567890',
      timestamp: 1234567890,
      signature: '0xsignature',
    };

    const mockSubscriptionToken = 'test-subscription-token';

    beforeEach(() => {
      service = createService();
    });

    it('successfully joins account to subscription', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'subscription-id',
          referralCode: 'REF123',
          accounts: ['0x1234567890123456789012345678901234567890'],
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.mobileJoin(
        mockMobileJoinBody,
        mockSubscriptionToken,
      );

      expect(result).toEqual({
        id: 'subscription-id',
        referralCode: 'REF123',
        accounts: ['0x1234567890123456789012345678901234567890'],
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/wr/subscriptions/mobile-join'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockMobileJoinBody),
          headers: expect.objectContaining({
            'rewards-access-token': mockSubscriptionToken,
          }),
        }),
      );
    });

    it('throws InvalidTimestampError when timestamp is invalid', async () => {
      const errorData = {
        message: 'Invalid timestamp',
        serverTimestamp: 9876543210000,
      };

      const mockResponse = {
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue(errorData),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.mobileJoin(mockMobileJoinBody, mockSubscriptionToken),
      ).rejects.toThrow(InvalidTimestampError);
    });

    it('throws AccountAlreadyRegisteredError when account is already registered (409)', async () => {
      const mockResponse = {
        ok: false,
        status: 409,
        json: jest.fn().mockResolvedValue({
          message: 'Account is already registered',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.mobileJoin(mockMobileJoinBody, mockSubscriptionToken),
      ).rejects.toThrow(AccountAlreadyRegisteredError);
    });

    it('throws error for failed join', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ message: 'Server error' }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(
        service.mobileJoin(mockMobileJoinBody, mockSubscriptionToken),
      ).rejects.toThrow('Mobile join failed: 500 Server error');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        service.mobileJoin(mockMobileJoinBody, mockSubscriptionToken),
      ).rejects.toThrow('Network error');
    });
  });

  describe('getDiscoverSeasons', () => {
    beforeEach(() => {
      service = createService();
    });

    it('successfully fetches discover seasons with both current and next season', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          current: {
            id: 'season-1',
            startDate: '2023-06-01T00:00:00Z',
            endDate: '2023-08-31T23:59:59Z',
          },
          next: {
            id: 'season-2',
            startDate: '2023-09-01T00:00:00Z',
            endDate: '2023-11-30T23:59:59Z',
          },
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.getDiscoverSeasons();

      expect(result.current).toBeDefined();
      expect(result.current?.id).toBe('season-1');
      expect(result.current?.startDate).toBeInstanceOf(Date);
      expect(result.current?.endDate).toBeInstanceOf(Date);

      expect(result.next).toBeDefined();
      expect(result.next?.id).toBe('season-2');
      expect(result.next?.startDate).toBeInstanceOf(Date);
      expect(result.next?.endDate).toBeInstanceOf(Date);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/public/seasons/status'),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('handles null current season', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          current: null,
          next: {
            id: 'season-2',
            startDate: '2023-09-01T00:00:00Z',
            endDate: '2023-11-30T23:59:59Z',
          },
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.getDiscoverSeasons();

      expect(result.current).toBeNull();
      expect(result.next).toBeDefined();
      expect(result.next?.id).toBe('season-2');
    });

    it('handles null next season', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          current: {
            id: 'season-1',
            startDate: '2023-06-01T00:00:00Z',
            endDate: '2023-08-31T23:59:59Z',
          },
          next: null,
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.getDiscoverSeasons();

      expect(result.current).toBeDefined();
      expect(result.current?.id).toBe('season-1');
      expect(result.next).toBeNull();
    });

    it('throws error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      } as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.getDiscoverSeasons()).rejects.toThrow(
        'Get discover seasons failed: 500',
      );
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.getDiscoverSeasons()).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('getSeasonMetadata', () => {
    const mockSeasonId = 'season-123';

    beforeEach(() => {
      service = createService();
    });

    it('successfully fetches season metadata', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: mockSeasonId,
          name: 'Summer Season',
          startDate: '2023-06-01T00:00:00Z',
          endDate: '2023-08-31T23:59:59Z',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.getSeasonMetadata(mockSeasonId);

      expect(result.id).toBe(mockSeasonId);
      expect(result.name).toBe('Summer Season');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.startDate.getTime()).toBe(
        new Date('2023-06-01T00:00:00Z').getTime(),
      );
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.endDate.getTime()).toBe(
        new Date('2023-08-31T23:59:59Z').getTime(),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/public/seasons/${mockSeasonId}/meta`),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('converts date strings to Date objects', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: mockSeasonId,
          name: 'Summer Season',
          startDate: '2023-06-01T00:00:00Z',
          endDate: '2023-08-31T23:59:59Z',
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValue(mockResponse);

      const result = await service.getSeasonMetadata(mockSeasonId);

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
    });

    it('throws error when response is not ok', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      } as Response;

      mockFetch.mockResolvedValue(mockResponse);

      await expect(service.getSeasonMetadata(mockSeasonId)).rejects.toThrow(
        'Get season metadata failed: 404',
      );
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.getSeasonMetadata(mockSeasonId)).rejects.toThrow(
        'Network error',
      );
    });
  });
});
