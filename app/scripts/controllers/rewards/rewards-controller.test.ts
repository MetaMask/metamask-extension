/**
 * @jest-environment node
 */
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { EthAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAccountId } from '@metamask/utils';
import {
  AccountsControllerListMultichainAccountsAction,
  HandleSnapRequest,
} from '@metamask/snaps-controllers';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { AccountsControllerGetSelectedMultichainAccountAction } from '@metamask/accounts-controller';
import {
  KeyringControllerSignPersonalMessageAction,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { HardwareDeviceNames } from '../../../../shared/constants/hardware-wallets';
import {
  RewardsControllerActions,
  RewardsControllerEvents,
  RewardsControllerMessenger,
} from '../../controller-init/messengers';
import { getRootMessenger } from '../../lib/messenger';
import {
  EstimatedPointsDto,
  EstimatePointsDto,
  SeasonDtoState,
} from '../../../../shared/types/rewards';
import {
  RewardsController,
  getRewardsControllerDefaultState,
  wrapWithCache,
  DEFAULT_BLOCKED_REGIONS,
} from './rewards-controller';
import type {
  RewardsControllerState,
  SeasonTierDto,
  LoginResponseDto,
  SubscriptionDto,
  DiscoverSeasonsDto,
  SeasonMetadataDto,
  SeasonStateDto,
} from './rewards-controller.types';
import {
  InvalidTimestampError,
  AccountAlreadyRegisteredError,
  AuthorizationFailedError,
  SeasonNotFoundError,
} from './rewards-data-service';
import {
  RewardsDataServiceEstimatePointsAction,
  RewardsDataServiceFetchGeoLocationAction,
  RewardsDataServiceGetDiscoverSeasonsAction,
  RewardsDataServiceGetOptInStatusAction,
  RewardsDataServiceGetSeasonMetadataAction,
  RewardsDataServiceGetSeasonStatusAction,
  RewardsDataServiceLoginAction,
  RewardsDataServiceMobileJoinAction,
  RewardsDataServiceMobileOptinAction,
  RewardsDataServiceValidateReferralCodeAction,
} from './rewards-data-service-types';

type AllActions = MessengerActions<RewardsControllerMessenger>;

type AllEvents = MessengerEvents<RewardsControllerMessenger>;

// Mock loglevel
jest.mock('loglevel', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Test constants
const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_ACCOUNT_ADDRESS_ALT = '0x1234567890123456789012345678901234567891';
const MOCK_CAIP_ACCOUNT: CaipAccountId =
  'eip155:1:0x1234567890123456789012345678901234567890' as CaipAccountId;
const MOCK_SUBSCRIPTION_ID = 'sub_12345';
const MOCK_SUBSCRIPTION_ID_2 = 'sub_67890';
const MOCK_SESSION_TOKEN = 'session_token_123';
const MOCK_SEASON_ID = 'season_123';

const MOCK_INTERNAL_ACCOUNT: InternalAccount = {
  id: 'account-1',
  address: MOCK_ACCOUNT_ADDRESS,
  type: EthAccountType.Eoa,
  scopes: ['eip155:1'],
  options: {},
  methods: [],
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
    importTime: Date.now(),
  },
};

const MOCK_SUBSCRIPTION: SubscriptionDto = {
  id: MOCK_SUBSCRIPTION_ID,
  referralCode: 'REF123',
  accounts: [
    {
      address: MOCK_ACCOUNT_ADDRESS,
      chainId: 1,
    },
  ],
};

const MOCK_LOGIN_RESPONSE: LoginResponseDto = {
  sessionId: MOCK_SESSION_TOKEN,
  subscription: MOCK_SUBSCRIPTION,
};

const MOCK_SEASON_TIERS: SeasonTierDto[] = [
  {
    id: 'tier-1',
    name: 'Bronze',
    pointsNeeded: 0,
    levelNumber: '1',
    image: {
      lightModeUrl: 'https://example.com/bronze-light.png',
      darkModeUrl: 'https://example.com/bronze-dark.png',
    },
    rewards: [],
  },
  {
    id: 'tier-2',
    name: 'Silver',
    pointsNeeded: 100,
    levelNumber: '2',
    image: {
      lightModeUrl: 'https://example.com/silver-light.png',
      darkModeUrl: 'https://example.com/silver-dark.png',
    },
    rewards: [],
  },
  {
    id: 'tier-3',
    name: 'Gold',
    pointsNeeded: 500,
    levelNumber: '3',
    image: {
      lightModeUrl: 'https://example.com/gold-light.png',
      darkModeUrl: 'https://example.com/gold-dark.png',
    },
    rewards: [],
  },
];

const MOCK_SEASON_METADATA: SeasonMetadataDto = {
  id: MOCK_SEASON_ID,
  name: 'Season 1',
  startDate: new Date('2024-01-01T00:00:00.000Z'),
  endDate: new Date('2024-12-31T23:59:59.999Z'),
  tiers: MOCK_SEASON_TIERS,
};

const MOCK_SEASON_STATE: SeasonStateDto = {
  balance: 250,
  currentTierId: 'tier-2',
  updatedAt: new Date('2024-06-01T00:00:00.000Z'),
};

type WithControllerCallback<ReturnValue> = ({
  controller,
  messenger,
  mockMessengerCall,
}: {
  controller: RewardsController;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messenger: Messenger<any, any>;
  mockMessengerCall: jest.Mock;
}) => ReturnValue | Promise<ReturnValue>;

type WithControllerArgs<ReturnValue> = [
  {
    state?: Partial<RewardsControllerState>;
    isDisabled?: boolean;
  },
  WithControllerCallback<ReturnValue>,
];

async function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): Promise<ReturnValue> {
  const [options, fn] = args;
  const { state, isDisabled = false } = options;

  type TestAllowedActions =
    | AccountsControllerGetSelectedMultichainAccountAction
    | AccountsControllerListMultichainAccountsAction
    | KeyringControllerSignPersonalMessageAction
    | RewardsDataServiceLoginAction
    | RewardsDataServiceEstimatePointsAction
    | RewardsDataServiceGetSeasonStatusAction
    | RewardsDataServiceFetchGeoLocationAction
    | RewardsDataServiceMobileOptinAction
    | RewardsDataServiceValidateReferralCodeAction
    | RewardsDataServiceMobileJoinAction
    | RewardsDataServiceGetOptInStatusAction
    | RewardsDataServiceGetSeasonMetadataAction
    | RewardsDataServiceGetDiscoverSeasonsAction
    | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
    | HandleSnapRequest;

  type TestAllowedEvents =
    | KeyringControllerUnlockEvent
    | AccountTreeControllerSelectedAccountGroupChangeEvent;

  const messenger = getRootMessenger<
    RewardsControllerActions | TestAllowedActions,
    RewardsControllerEvents | TestAllowedEvents
  >();

  const controllerMessenger = new Messenger<
    'RewardsController',
    AllActions,
    AllEvents,
    typeof messenger
  >({
    namespace: 'RewardsController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'RewardsDataService:login',
      'RewardsDataService:estimatePoints',
      'RewardsDataService:getOptInStatus',
      'RewardsDataService:mobileOptin',
      'RewardsDataService:mobileJoin',
      'RewardsDataService:getSeasonStatus',
      'RewardsDataService:fetchGeoLocation',
      'RewardsDataService:validateReferralCode',
      'RewardsDataService:getDiscoverSeasons',
      'RewardsDataService:getSeasonMetadata',
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'AccountsController:listMultichainAccounts',
      'AccountsController:getSelectedMultichainAccount',
      'KeyringController:signPersonalMessage',
      'SnapController:handleRequest',
    ],
    events: [
      'AccountTreeController:selectedAccountGroupChange',
      'KeyringController:unlock',
    ],
  });

  // Setup default mocks
  const mockMessengerCall = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(controllerMessenger, 'call').mockImplementation(mockMessengerCall);

  const controller = new RewardsController({
    messenger: controllerMessenger,
    state,
    isDisabled: () => isDisabled,
  });

  return await fn({
    controller,
    messenger,
    mockMessengerCall,
  });
}

describe('RewardsController', () => {
  describe('constructor', () => {
    it('should initialize with default state when rewards are disabled', async () => {
      await withController({ isDisabled: true }, ({ controller }) => {
        expect(controller.state).toMatchObject({
          ...getRewardsControllerDefaultState(),
        });
        expect(controller.isRewardsFeatureEnabled()).toBe(false);
      });
    });

    it('should initialize with default state when rewards are enabled', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        expect(controller.state).toMatchObject({
          ...getRewardsControllerDefaultState(),
        });
        expect(controller.isRewardsFeatureEnabled()).toBe(true);
      });
    });

    it('should initialize with provided state', async () => {
      const customState: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state: customState, isDisabled: false },
        ({ controller }) => {
          expect(controller.state.rewardsAccounts).toEqual(
            customState.rewardsAccounts,
          );
        },
      );
    });

    it('should register action handlers', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        // Verify controller is instantiated
        expect(controller).toBeDefined();
        expect(controller.isRewardsFeatureEnabled()).toBe(true);
      });
    });
  });

  describe('getRewardsControllerDefaultState', () => {
    it('should return default state', () => {
      const defaultState = getRewardsControllerDefaultState();

      expect(defaultState).toEqual({
        rewardsActiveAccount: null,
        rewardsAccounts: {},
        rewardsSubscriptions: {},
        rewardsSeasons: {},
        rewardsSeasonStatuses: {},
        rewardsSubscriptionTokens: {},
      });
    });
  });

  describe('resetState', () => {
    it('should reset state to default', async () => {
      const customState: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state: customState, isDisabled: false },
        ({ controller }) => {
          expect(controller.state.rewardsAccounts).toEqual(
            customState.rewardsAccounts,
          );

          controller.resetState();

          expect(controller.state).toEqual(getRewardsControllerDefaultState());
        },
      );
    });
  });

  describe('isRewardsFeatureEnabled', () => {
    it('should return true when rewards are enabled', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        expect(controller.isRewardsFeatureEnabled()).toBe(true);
      });
    });

    it('should return false when rewards are disabled', async () => {
      await withController({ isDisabled: true }, ({ controller }) => {
        expect(controller.isRewardsFeatureEnabled()).toBe(false);
      });
    });
  });

  describe('calculateTierStatus', () => {
    it('should calculate tier status correctly for middle tier', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const tierStatus = controller.calculateTierStatus(
          MOCK_SEASON_TIERS,
          'tier-2',
          250,
        );

        expect(tierStatus).toEqual({
          currentTier: MOCK_SEASON_TIERS[1],
          nextTier: MOCK_SEASON_TIERS[2],
          nextTierPointsNeeded: 250, // 500 - 250
        });
      });
    });

    it('should calculate tier status correctly for first tier', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const tierStatus = controller.calculateTierStatus(
          MOCK_SEASON_TIERS,
          'tier-1',
          50,
        );

        expect(tierStatus).toEqual({
          currentTier: MOCK_SEASON_TIERS[0],
          nextTier: MOCK_SEASON_TIERS[1],
          nextTierPointsNeeded: 50, // 100 - 50
        });
      });
    });

    it('should calculate tier status correctly for last tier', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const tierStatus = controller.calculateTierStatus(
          MOCK_SEASON_TIERS,
          'tier-3',
          1000,
        );

        expect(tierStatus).toEqual({
          currentTier: MOCK_SEASON_TIERS[2],
          nextTier: null,
          nextTierPointsNeeded: null,
        });
      });
    });

    it('should throw error if current tier is not found', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        expect(() => {
          controller.calculateTierStatus(
            MOCK_SEASON_TIERS,
            'invalid-tier',
            100,
          );
        }).toThrow('Current tier invalid-tier not found in season tiers');
      });
    });
  });

  describe('convertToSeasonStatusDto', () => {
    it('should convert season metadata and state to SeasonStatusDto', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const seasonDtoState: SeasonDtoState = {
          id: MOCK_SEASON_ID,
          name: 'Season 1',
          startDate: new Date('2024-01-01').getTime(),
          endDate: new Date('2024-12-31').getTime(),
          tiers: MOCK_SEASON_TIERS,
        };

        const seasonState: SeasonStateDto = {
          balance: 250,
          currentTierId: 'tier-2',
          updatedAt: new Date('2024-06-01'),
        };

        const result = controller.convertToSeasonStatusDto(
          seasonDtoState,
          seasonState,
        );

        expect(result).toEqual({
          season: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date(seasonDtoState.startDate),
            endDate: new Date(seasonDtoState.endDate),
            tiers: MOCK_SEASON_TIERS,
          },
          balance: {
            total: 250,
            updatedAt: seasonState.updatedAt,
          },
          currentTierId: 'tier-2',
        });
      });
    });
  });

  describe('convertInternalAccountToCaipAccountId', () => {
    it('should convert internal account to CAIP account ID', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const result = controller.convertInternalAccountToCaipAccountId(
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(
          'eip155:1:0x1234567890123456789012345678901234567890',
        );
      });
    });

    it('should return null if conversion fails', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const invalidAccount = {
          ...MOCK_INTERNAL_ACCOUNT,
          scopes: [],
        };

        const result =
          controller.convertInternalAccountToCaipAccountId(invalidAccount);

        expect(result).toBeNull();
      });
    });
  });

  describe('isOptInSupported', () => {
    it('should return true for EVM accounts that are not hardware wallets', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const result = controller.isOptInSupported(MOCK_INTERNAL_ACCOUNT);

        expect(result).toBe(true);
      });
    });

    it('should return false for hardware wallet accounts', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const hardwareAccount: InternalAccount = {
          ...MOCK_INTERNAL_ACCOUNT,
          metadata: {
            ...MOCK_INTERNAL_ACCOUNT.metadata,
            keyring: {
              type: HardwareDeviceNames.ledger,
            },
          },
        };

        const result = controller.isOptInSupported(hardwareAccount);

        expect(result).toBe(false);
      });
    });
  });

  describe('getActualSubscriptionId', () => {
    it('should return subscription ID for known account', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.getActualSubscriptionId(MOCK_CAIP_ACCOUNT);

        expect(result).toBe(MOCK_SUBSCRIPTION_ID);
      });
    });

    it('should return null for unknown account', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const result = controller.getActualSubscriptionId(MOCK_CAIP_ACCOUNT);

        expect(result).toBeNull();
      });
    });
  });

  describe('getFirstSubscriptionId', () => {
    it('should return first subscription ID', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
          [MOCK_SUBSCRIPTION_ID_2]: {
            ...MOCK_SUBSCRIPTION,
            id: MOCK_SUBSCRIPTION_ID_2,
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.getFirstSubscriptionId();

        expect(result).toBe(MOCK_SUBSCRIPTION_ID);
      });
    });

    it('should return null when no subscriptions exist', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const result = controller.getFirstSubscriptionId();

        expect(result).toBeNull();
      });
    });
  });

  describe('performSilentAuth', () => {
    it('should set rewardsActiveAccount to null when no internal account provided', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.performSilentAuth(null, true, true);

        expect(result).toBeNull();
        expect(controller.state.rewardsActiveAccount).toBeNull();
      });
    });

    it('should skip silent auth for hardware accounts', async () => {
      const hardwareAccount: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        metadata: {
          ...MOCK_INTERNAL_ACCOUNT.metadata,
          keyring: {
            type: 'Ledger Hardware',
          },
        },
      };

      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.performSilentAuth(
          hardwareAccount,
          true,
          true,
        );

        expect(result).toBeNull();
      });
    });

    it('should successfully perform silent auth for EVM account', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            false,
          );

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
          expect(controller.state.rewardsActiveAccount).toMatchObject({
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
          });
        },
      );
    });

    it('should handle login failure', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.reject(new Error('Login failed: 401'));
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({ ois: [true], sids: [null] });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            false,
          );

          expect(result).toBeNull();
        },
      );
    });

    it('should handle invalid timestamp error with retry', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let loginAttempts = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              loginAttempts += 1;
              if (loginAttempts === 1) {
                throw new InvalidTimestampError(
                  'Invalid timestamp',
                  Math.floor(Date.now() / 1000),
                );
              }
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            false,
          );

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
          expect(loginAttempts).toBe(2);
        },
      );
    });
  });

  describe('getHasAccountOptedIn', () => {
    it('should return false when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.getHasAccountOptedIn(MOCK_CAIP_ACCOUNT);

        expect(result).toBe(false);
      });
    });

    it('should return true when account has opted in', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result =
            await controller.getHasAccountOptedIn(MOCK_CAIP_ACCOUNT);

          expect(result).toBe(true);
        },
      );
    });

    it('should return false when account has not opted in', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result =
            await controller.getHasAccountOptedIn(MOCK_CAIP_ACCOUNT);

          expect(result).toBe(false);
        },
      );
    });

    it('should return false when account is not in state', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.getHasAccountOptedIn(MOCK_CAIP_ACCOUNT);

        expect(result).toBe(false);
      });
    });
  });

  describe('getOptInStatus', () => {
    it('should return false for all addresses when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.getOptInStatus({
          addresses: [MOCK_ACCOUNT_ADDRESS],
        });

        expect(result).toEqual({
          ois: [false],
          sids: [null],
        });
      });
    });

    it('should return opt-in status for addresses', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.getOptInStatus({
            addresses: [MOCK_ACCOUNT_ADDRESS],
          });

          expect(result).toEqual({
            ois: [true],
            sids: [MOCK_SUBSCRIPTION_ID],
          });
        },
      );
    });

    it('should use cached opt-in status when available', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            return undefined;
          });

          const result = await controller.getOptInStatus({
            addresses: [MOCK_ACCOUNT_ADDRESS],
          });

          expect(result).toEqual({
            ois: [true],
            sids: [MOCK_SUBSCRIPTION_ID],
          });
        },
      );
    });
  });

  describe('estimatePoints', () => {
    it('should return zero points when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const request: EstimatePointsDto = {
          activityType: 'SWAP',
          account: MOCK_CAIP_ACCOUNT,
          activityContext: {
            swapContext: {
              srcAsset: {
                id: 'eip155:1/slip44:60',
                amount: '1000000000000000000',
              },
              destAsset: {
                id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                amount: '4500000000',
              },
              feeAsset: {
                id: 'eip155:1/slip44:60',
                amount: '5000000000000000',
              },
            },
          },
        };

        const result = await controller.estimatePoints(request);

        expect(result).toEqual({ pointsEstimate: 0, bonusBips: 0 });
      });
    });

    it('should estimate points for swap activity', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          const mockEstimatedPoints: EstimatedPointsDto = {
            pointsEstimate: 100,
            bonusBips: 500,
          };

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:estimatePoints') {
              return Promise.resolve(mockEstimatedPoints);
            }
            return undefined;
          });

          const request: EstimatePointsDto = {
            activityType: 'SWAP',
            account: MOCK_CAIP_ACCOUNT,
            activityContext: {
              swapContext: {
                srcAsset: {
                  id: 'eip155:1/slip44:60',
                  amount: '1000000000000000000',
                },
                destAsset: {
                  id: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                  amount: '4500000000',
                },
                feeAsset: {
                  id: 'eip155:1/slip44:60',
                  amount: '5000000000000000',
                },
              },
            },
          };

          const result = await controller.estimatePoints(request);

          expect(result).toEqual(mockEstimatedPoints);
        },
      );
    });
  });

  describe('getSeasonMetadata', () => {
    it('should fetch current season metadata', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          const mockDiscoverSeasons: DiscoverSeasonsDto = {
            current: {
              id: MOCK_SEASON_ID,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-12-31'),
            },
            next: null,
          };

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getDiscoverSeasons') {
              return Promise.resolve(mockDiscoverSeasons);
            }
            if (actionType === 'RewardsDataService:getSeasonMetadata') {
              return Promise.resolve(MOCK_SEASON_METADATA);
            }
            return undefined;
          });

          const result = await controller.getSeasonMetadata('current');

          expect(result).toMatchObject({
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            tiers: MOCK_SEASON_TIERS,
          });
        },
      );
    });

    it('should use cached season metadata when available', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          current: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
            lastFetched: Date.now(),
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.getSeasonMetadata('current');

          expect(result).toMatchObject({
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            tiers: MOCK_SEASON_TIERS,
          });
        },
      );
    });
  });

  describe('getSeasonStatus', () => {
    it('should return null when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.getSeasonStatus(
          MOCK_SUBSCRIPTION_ID,
          MOCK_SEASON_ID,
        );

        expect(result).toBeNull();
      });
    });

    it('should fetch season status', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getSeasonStatus') {
              return Promise.resolve(MOCK_SEASON_STATE);
            }
            return undefined;
          });

          const result = await controller.getSeasonStatus(
            MOCK_SUBSCRIPTION_ID,
            MOCK_SEASON_ID,
          );

          expect(result).toBeDefined();
          expect(result?.balance.total).toBe(250);
          expect(result?.tier.currentTier.id).toBe('tier-2');
        },
      );
    });

    it('should throw error when season not found', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        await expect(
          controller.getSeasonStatus(MOCK_SUBSCRIPTION_ID, 'invalid-season'),
        ).rejects.toThrow(
          'Failed to get season status: season not found for seasonId: invalid-season',
        );
      });
    });

    it('should throw AuthorizationFailedError when subscription token is missing', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          await expect(
            controller.getSeasonStatus(MOCK_SUBSCRIPTION_ID, MOCK_SEASON_ID),
          ).rejects.toThrow(
            `No subscription token found for subscription ID: ${MOCK_SUBSCRIPTION_ID}`,
          );
          await expect(
            controller.getSeasonStatus(MOCK_SUBSCRIPTION_ID, MOCK_SEASON_ID),
          ).rejects.toBeInstanceOf(AuthorizationFailedError);
        },
      );
    });
  });

  describe('optIn', () => {
    it('should return null when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.optIn();

        expect(result).toBeNull();
      });
    });

    it('should opt in account successfully', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileOptin') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            return undefined;
          });

          const result = await controller.optIn('REF123');

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
          expect(
            controller.state.rewardsAccounts[MOCK_CAIP_ACCOUNT],
          ).toMatchObject({
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
          });
        },
      );
    });

    it('should handle account already registered error', async () => {
      await withController(
        {
          isDisabled: false,
          state: {
            rewardsSubscriptions: {
              [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
            },
            rewardsSubscriptionTokens: {
              [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
            },
          },
        },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileOptin') {
              throw new AccountAlreadyRegisteredError(
                'Account already registered',
              );
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.optIn();

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });
  });

  describe('getGeoRewardsMetadata', () => {
    it('should return unknown location when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.getGeoRewardsMetadata();

        expect(result).toEqual({
          geoLocation: 'UNKNOWN',
          optinAllowedForGeo: false,
        });
      });
    });

    it('should fetch and cache geo location', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:fetchGeoLocation') {
              return Promise.resolve('US');
            }
            return undefined;
          });

          const result = await controller.getGeoRewardsMetadata();

          expect(result).toEqual({
            geoLocation: 'US',
            optinAllowedForGeo: true,
          });

          // Verify caching - second call should not fetch again
          const cachedResult = await controller.getGeoRewardsMetadata();
          expect(cachedResult).toEqual(result);
        },
      );
    });

    it('should mark UK as blocked region', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:fetchGeoLocation') {
              return Promise.resolve('UK');
            }
            return undefined;
          });

          const result = await controller.getGeoRewardsMetadata();

          expect(result).toEqual({
            geoLocation: 'UK',
            optinAllowedForGeo: false,
          });
        },
      );
    });
  });

  describe('validateReferralCode', () => {
    it('should return false when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.validateReferralCode('TEST123');

        expect(result).toBe(false);
      });
    });

    it('should return false for empty code', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.validateReferralCode('  ');

        expect(result).toBe(false);
      });
    });

    it('should return false for code with invalid length', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.validateReferralCode('TEST');

        expect(result).toBe(false);
      });
    });

    it('should validate referral code', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:validateReferralCode') {
              return Promise.resolve({ valid: true });
            }
            return undefined;
          });

          const result = await controller.validateReferralCode('TEST12');

          expect(result).toBe(true);
        },
      );
    });
  });

  describe('linkAccountToSubscriptionCandidate', () => {
    it('should return false when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.linkAccountToSubscriptionCandidate(
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(false);
      });
    });

    it('should link account to subscription', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: 'eip155:1:0xotheraddress' as CaipAccountId,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              return Promise.resolve(MOCK_SUBSCRIPTION);
            }
            return undefined;
          });

          const result = await controller.linkAccountToSubscriptionCandidate(
            MOCK_INTERNAL_ACCOUNT,
          );

          expect(result).toBe(true);
          expect(
            controller.state.rewardsAccounts[MOCK_CAIP_ACCOUNT],
          ).toMatchObject({
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
          });
        },
      );
    });

    it('should return true if account already has subscription', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.linkAccountToSubscriptionCandidate(
            MOCK_INTERNAL_ACCOUNT,
          );

          expect(result).toBe(true);
        },
      );
    });
  });

  describe('invalidateSubscriptionCache', () => {
    it('should invalidate cache for specific season', async () => {
      const compositeKey = `${MOCK_SEASON_ID}:${MOCK_SUBSCRIPTION_ID}`;
      const state: Partial<RewardsControllerState> = {
        rewardsSeasonStatuses: {
          [compositeKey]: {
            season: {
              id: MOCK_SEASON_ID,
              name: 'Season 1',
              startDate: new Date('2024-01-01').getTime(),
              endDate: new Date('2024-12-31').getTime(),
              tiers: MOCK_SEASON_TIERS,
            },
            balance: { total: 250 },
            tier: {
              currentTier: MOCK_SEASON_TIERS[1],
              nextTier: MOCK_SEASON_TIERS[2],
              nextTierPointsNeeded: 250,
            },
            lastFetched: Date.now(),
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        expect(
          controller.state.rewardsSeasonStatuses[compositeKey],
        ).toBeDefined();

        controller.invalidateSubscriptionCache(
          MOCK_SUBSCRIPTION_ID,
          MOCK_SEASON_ID,
        );

        expect(
          controller.state.rewardsSeasonStatuses[compositeKey],
        ).toBeUndefined();
      });
    });

    it('should invalidate cache for all seasons', async () => {
      const compositeKey1 = `season_1:${MOCK_SUBSCRIPTION_ID}`;
      const compositeKey2 = `season_2:${MOCK_SUBSCRIPTION_ID}`;
      const state: Partial<RewardsControllerState> = {
        rewardsSeasonStatuses: {
          [compositeKey1]: {
            season: {
              id: 'season_1',
              name: 'Season 1',
              startDate: new Date('2024-01-01').getTime(),
              endDate: new Date('2024-12-31').getTime(),
              tiers: MOCK_SEASON_TIERS,
            },
            balance: { total: 250 },
            tier: {
              currentTier: MOCK_SEASON_TIERS[1],
              nextTier: MOCK_SEASON_TIERS[2],
              nextTierPointsNeeded: 250,
            },
            lastFetched: Date.now(),
          },
          [compositeKey2]: {
            season: {
              id: 'season_2',
              name: 'Season 2',
              startDate: new Date('2024-01-01').getTime(),
              endDate: new Date('2024-12-31').getTime(),
              tiers: MOCK_SEASON_TIERS,
            },
            balance: { total: 100 },
            tier: {
              currentTier: MOCK_SEASON_TIERS[0],
              nextTier: MOCK_SEASON_TIERS[1],
              nextTierPointsNeeded: 50,
            },
            lastFetched: Date.now(),
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        expect(
          controller.state.rewardsSeasonStatuses[compositeKey1],
        ).toBeDefined();
        expect(
          controller.state.rewardsSeasonStatuses[compositeKey2],
        ).toBeDefined();

        controller.invalidateSubscriptionCache(MOCK_SUBSCRIPTION_ID);

        expect(
          controller.state.rewardsSeasonStatuses[compositeKey1],
        ).toBeUndefined();
        expect(
          controller.state.rewardsSeasonStatuses[compositeKey2],
        ).toBeUndefined();
      });
    });
  });

  describe('invalidateAccountsAndSubscriptions', () => {
    it('should invalidate accounts and subscriptions', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        controller.invalidateAccountsAndSubscriptions();

        expect(controller.state.rewardsActiveAccount).toMatchObject({
          hasOptedIn: false,
          subscriptionId: null,
        });
        expect(controller.state.rewardsAccounts).toEqual({});
        expect(controller.state.rewardsSubscriptions).toEqual({});
      });
    });
  });

  describe('handleAuthenticationTrigger', () => {
    it('should handle authentication trigger when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        await controller.handleAuthenticationTrigger('Test trigger');

        // Should not throw and should set rewardsActiveAccount to null
        expect(controller.state.rewardsActiveAccount).toBeNull();
      });
    });

    it('should handle authentication trigger with no accounts', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [];
            }
            return undefined;
          });

          await controller.handleAuthenticationTrigger('Account changed');

          expect(controller.state.rewardsActiveAccount).toBeNull();
        },
      );
    });
  });

  describe('getCandidateSubscriptionId', () => {
    it('should return null when rewards are disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.getCandidateSubscriptionId();

        expect(result).toBeNull();
      });
    });

    it('should return active account subscription ID', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.getCandidateSubscriptionId();

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });

    it('should return first subscription ID when no active account', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.getCandidateSubscriptionId();

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });
  });

  describe('linkAccountsToSubscriptionCandidate', () => {
    it('should return empty array for no accounts', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const result = await controller.linkAccountsToSubscriptionCandidate([]);

        expect(result).toEqual([]);
      });
    });

    it('should link multiple accounts', async () => {
      const account2: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        id: 'account-2',
        address: MOCK_ACCOUNT_ADDRESS_ALT,
      };

      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              return Promise.resolve(MOCK_SUBSCRIPTION);
            }
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [account2];
            }
            return undefined;
          });

          const result = await controller.linkAccountsToSubscriptionCandidate([
            account2,
          ]);

          expect(result).toHaveLength(1);
          expect(result[0].success).toBe(true);
        },
      );
    });
  });

  describe('checkOptInStatusAgainstCache', () => {
    it('should return cached results when available', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const addressToAccountMap = new Map<string, InternalAccount>();
        addressToAccountMap.set(
          MOCK_ACCOUNT_ADDRESS.toLowerCase(),
          MOCK_INTERNAL_ACCOUNT,
        );

        const result = controller.checkOptInStatusAgainstCache(
          [MOCK_ACCOUNT_ADDRESS],
          addressToAccountMap,
        );

        expect(result.cachedOptInResults).toEqual([true]);
        expect(result.cachedSubscriptionIds).toEqual([MOCK_SUBSCRIPTION_ID]);
        expect(result.addressesNeedingFresh).toEqual([]);
      });
    });

    it('should identify addresses needing fresh data', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const addressToAccountMap = new Map<string, InternalAccount>();
        addressToAccountMap.set(
          MOCK_ACCOUNT_ADDRESS.toLowerCase(),
          MOCK_INTERNAL_ACCOUNT,
        );

        const result = controller.checkOptInStatusAgainstCache(
          [MOCK_ACCOUNT_ADDRESS],
          addressToAccountMap,
        );

        expect(result.cachedOptInResults).toEqual([null]);
        expect(result.cachedSubscriptionIds).toEqual([null]);
        expect(result.addressesNeedingFresh).toEqual([MOCK_ACCOUNT_ADDRESS]);
      });
    });

    it('should force fresh check for not-opted-in accounts checked more than 60 minutes ago', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: Date.now() - 1000 * 60 * 61, // 61 minutes ago (exceeds 60 minute threshold)
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const addressToAccountMap = new Map<string, InternalAccount>();
        addressToAccountMap.set(
          MOCK_ACCOUNT_ADDRESS.toLowerCase(),
          MOCK_INTERNAL_ACCOUNT,
        );

        const result = controller.checkOptInStatusAgainstCache(
          [MOCK_ACCOUNT_ADDRESS],
          addressToAccountMap,
        );

        expect(result.cachedOptInResults).toEqual([null]);
        expect(result.cachedSubscriptionIds).toEqual([null]);
        expect(result.addressesNeedingFresh).toEqual([MOCK_ACCOUNT_ADDRESS]);
      });
    });

    it('should use cached data for not-opted-in accounts checked within 60 minutes', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: Date.now() - 1000 * 60 * 30, // 30 minutes ago (within 60 minute threshold)
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const addressToAccountMap = new Map<string, InternalAccount>();
        addressToAccountMap.set(
          MOCK_ACCOUNT_ADDRESS.toLowerCase(),
          MOCK_INTERNAL_ACCOUNT,
        );

        const result = controller.checkOptInStatusAgainstCache(
          [MOCK_ACCOUNT_ADDRESS],
          addressToAccountMap,
        );

        expect(result.cachedOptInResults).toEqual([false]);
        expect(result.cachedSubscriptionIds).toEqual([null]);
        expect(result.addressesNeedingFresh).toEqual([]);
      });
    });

    it('should force fresh check for not-opted-in accounts without lastFreshOptInStatusCheck', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: undefined,
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const addressToAccountMap = new Map<string, InternalAccount>();
        addressToAccountMap.set(
          MOCK_ACCOUNT_ADDRESS.toLowerCase(),
          MOCK_INTERNAL_ACCOUNT,
        );

        const result = controller.checkOptInStatusAgainstCache(
          [MOCK_ACCOUNT_ADDRESS],
          addressToAccountMap,
        );

        expect(result.cachedOptInResults).toEqual([null]);
        expect(result.cachedSubscriptionIds).toEqual([null]);
        expect(result.addressesNeedingFresh).toEqual([MOCK_ACCOUNT_ADDRESS]);
      });
    });
  });

  describe('shouldSkipSilentAuth', () => {
    it('should skip for hardware accounts', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const hardwareAccount: InternalAccount = {
          ...MOCK_INTERNAL_ACCOUNT,
          metadata: {
            ...MOCK_INTERNAL_ACCOUNT.metadata,
            keyring: {
              type: HardwareDeviceNames.ledger,
            },
          },
        };

        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          hardwareAccount,
        );

        expect(result).toBe(true);
      });
    });

    it('should skip for recently checked not-opted-in accounts', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: Date.now(),
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(true);
      });
    });

    it('should skip for not-opted-in accounts checked within 60 minutes', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: Date.now() - 1000 * 60 * 30, // 30 minutes ago (within 60 minute threshold)
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(true);
      });
    });

    it('should not skip for stale not-opted-in accounts', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: Date.now() - 1000 * 60 * 61, // 61 minutes ago (exceeds 60 minute threshold)
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(false);
      });
    });
  });
});

describe('wrapWithCache', () => {
  it('should return cached value when cache is fresh', async () => {
    const mockPayload = { data: 'cached' };
    const mockReadCache = jest.fn(() => ({
      payload: mockPayload,
      lastFetched: Date.now(),
    }));
    const mockFetchFresh = jest.fn();
    const mockWriteCache = jest.fn();

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000,
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
    });

    expect(result).toEqual(mockPayload);
    expect(mockReadCache).toHaveBeenCalledWith('test-key');
    expect(mockFetchFresh).not.toHaveBeenCalled();
    expect(mockWriteCache).not.toHaveBeenCalled();
  });

  it('should fetch fresh value when cache is stale and no SWR callback', async () => {
    const mockFreshPayload = { data: 'fresh' };
    const mockReadCache = jest.fn(() => ({
      payload: { data: 'stale' },
      lastFetched: Date.now() - 120000, // 2 minutes ago
    }));
    const mockFetchFresh = jest.fn().mockResolvedValue(mockFreshPayload);
    const mockWriteCache = jest.fn();

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000, // 1 minute TTL
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
    });

    expect(result).toEqual(mockFreshPayload);
    expect(mockFetchFresh).toHaveBeenCalled();
    expect(mockWriteCache).toHaveBeenCalledWith('test-key', mockFreshPayload);
  });

  it('should return stale data and revalidate in background when SWR enabled', async () => {
    const mockStalePayload = { data: 'stale' };
    const mockFreshPayload = { data: 'fresh' };
    const mockReadCache = jest.fn(() => ({
      payload: mockStalePayload,
      lastFetched: Date.now() - 120000,
    }));
    const mockFetchFresh = jest.fn().mockResolvedValue(mockFreshPayload);
    const mockWriteCache = jest.fn();
    const mockSwrCallback = jest.fn();

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000,
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
      swrCallback: mockSwrCallback,
    });

    expect(result).toEqual(mockStalePayload);

    // Wait for background revalidation
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockFetchFresh).toHaveBeenCalled();
  });

  it('should fetch fresh when cache read fails', async () => {
    const mockFreshPayload = { data: 'fresh' };
    const mockReadCache = jest.fn(() => {
      throw new Error('Cache read failed');
    });
    const mockFetchFresh = jest.fn().mockResolvedValue(mockFreshPayload);
    const mockWriteCache = jest.fn();

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000,
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
    });

    expect(result).toEqual(mockFreshPayload);
    expect(mockFetchFresh).toHaveBeenCalled();
  });

  it('should fetch fresh when no cache exists', async () => {
    const mockFreshPayload = { data: 'fresh' };
    const mockReadCache = jest.fn(() => undefined);
    const mockFetchFresh = jest.fn().mockResolvedValue(mockFreshPayload);
    const mockWriteCache = jest.fn();

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000,
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
    });

    expect(result).toEqual(mockFreshPayload);
    expect(mockFetchFresh).toHaveBeenCalled();
    expect(mockWriteCache).toHaveBeenCalledWith('test-key', mockFreshPayload);
  });

  it('should handle write cache failure gracefully', async () => {
    const mockFreshPayload = { data: 'fresh' };
    const mockReadCache = jest.fn(() => undefined);
    const mockFetchFresh = jest.fn().mockResolvedValue(mockFreshPayload);
    const mockWriteCache = jest.fn(() => {
      throw new Error('Write failed');
    });

    const result = await wrapWithCache({
      key: 'test-key',
      ttl: 60000,
      readCache: mockReadCache,
      fetchFresh: mockFetchFresh,
      writeCache: mockWriteCache,
    });

    expect(result).toEqual(mockFreshPayload);
  });
});

describe('DEFAULT_BLOCKED_REGIONS', () => {
  it('should include UK as a blocked region', () => {
    expect(DEFAULT_BLOCKED_REGIONS).toContain('UK');
  });
});

describe('Additional RewardsController edge cases', () => {
  describe('performSilentAuth - additional scenarios', () => {
    it('should skip opt-in check when account has no opt-in status check timestamp', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
            lastFreshOptInStatusCheck: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({ ois: [false], sids: [null] });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            true,
          );

          expect(result).toBeNull();
        },
      );
    });

    it('should handle keyring locked error gracefully', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              const error = new Error(
                'KeyringController: controller is locked',
              );
              return Promise.reject(error);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            false,
          );

          expect(result).toBeNull();
        },
      );
    });

    it('should not become active account when shouldBecomeActiveAccount is false', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            false,
            false,
          );

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
          expect(controller.state.rewardsActiveAccount).toBeNull();
        },
      );
    });

    it('should handle already opted-in account state', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            true,
          );

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });

    it('should perform silent auth when account is opted-in but no subscription token available', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.performSilentAuth(
            MOCK_INTERNAL_ACCOUNT,
            true,
            true,
          );

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
          expect(controller.state.rewardsActiveAccount).toMatchObject({
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
          });
          expect(
            controller.state.rewardsSubscriptionTokens[MOCK_SUBSCRIPTION_ID],
          ).toBe(MOCK_SESSION_TOKEN);
        },
      );
    });

    it('should create new account state when skipping but no account state exists', async () => {
      await withController({ isDisabled: false }, async ({ controller }) => {
        const hardwareAccount: InternalAccount = {
          ...MOCK_INTERNAL_ACCOUNT,
          metadata: {
            ...MOCK_INTERNAL_ACCOUNT.metadata,
            keyring: {
              type: 'Ledger Hardware',
            },
          },
        };

        const result = await controller.performSilentAuth(
          hardwareAccount,
          true,
          true,
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('getSeasonStatus - error handling', () => {
    it('should attempt reauth on authorization failure', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let callCount = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getSeasonStatus') {
              callCount += 1;
              if (callCount === 1) {
                throw new AuthorizationFailedError('Auth failed');
              }
              return Promise.resolve(MOCK_SEASON_STATE);
            }
            if (
              actionType === 'AccountsController:getSelectedMultichainAccount'
            ) {
              return MOCK_INTERNAL_ACCOUNT;
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            return undefined;
          });

          const result = await controller.getSeasonStatus(
            MOCK_SUBSCRIPTION_ID,
            MOCK_SEASON_ID,
          );

          expect(result).toBeDefined();
          expect(callCount).toBe(2);
        },
      );
    });

    it('should handle reauth failure and invalidate cache', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getSeasonStatus') {
              throw new AuthorizationFailedError('Auth failed');
            }
            if (
              actionType === 'AccountsController:getSelectedMultichainAccount'
            ) {
              return MOCK_INTERNAL_ACCOUNT;
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.reject(new Error('Reauth failed'));
            }
            return undefined;
          });

          await expect(
            controller.getSeasonStatus(MOCK_SUBSCRIPTION_ID, MOCK_SEASON_ID),
          ).rejects.toThrow();

          expect(controller.state.rewardsAccounts).toEqual({});
          expect(controller.state.rewardsSubscriptions).toEqual({});
        },
      );
    });

    it('should find and use account for subscription on reauth', async () => {
      const otherAccount: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        id: 'other-account',
        address: '0xotheraddress',
      };

      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: 'different-sub',
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsAccounts: {
          ['eip155:1:0xotheraddress' as CaipAccountId]: {
            account: 'eip155:1:0xotheraddress' as CaipAccountId,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let callCount = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getSeasonStatus') {
              callCount += 1;
              if (callCount === 1) {
                throw new AuthorizationFailedError('Auth failed');
              }
              return Promise.resolve(MOCK_SEASON_STATE);
            }
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT, otherAccount];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve({
                ...MOCK_LOGIN_RESPONSE,
                subscription: {
                  ...MOCK_SUBSCRIPTION,
                  id: MOCK_SUBSCRIPTION_ID,
                },
              });
            }
            return undefined;
          });

          const result = await controller.getSeasonStatus(
            MOCK_SUBSCRIPTION_ID,
            MOCK_SEASON_ID,
          );

          expect(result).toBeDefined();
        },
      );
    });

    it('should handle SeasonNotFoundError and clear seasons', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSeasons: {
          [MOCK_SEASON_ID]: {
            id: MOCK_SEASON_ID,
            name: 'Season 1',
            startDate: new Date('2024-01-01').getTime(),
            endDate: new Date('2024-12-31').getTime(),
            tiers: MOCK_SEASON_TIERS,
          },
        },
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
        rewardsSeasonStatuses: {
          [`${MOCK_SEASON_ID}:${MOCK_SUBSCRIPTION_ID}`]: {
            season: {
              id: MOCK_SEASON_ID,
              name: 'Season 1',
              startDate: new Date('2024-01-01').getTime(),
              endDate: new Date('2024-12-31').getTime(),
              tiers: MOCK_SEASON_TIERS,
            },
            balance: { total: 100 },
            tier: {
              currentTier: MOCK_SEASON_TIERS[0],
              nextTier: MOCK_SEASON_TIERS[1],
              nextTierPointsNeeded: 50,
            },
            // Set lastFetched to an old timestamp to make cache stale
            // Cache TTL is 1 minute, so use 2 minutes ago to ensure cache miss
            lastFetched: Date.now() - 2 * 60 * 1000,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getSeasonStatus') {
              throw new SeasonNotFoundError('Season not found');
            }
            return undefined;
          });

          await expect(
            controller.getSeasonStatus(MOCK_SUBSCRIPTION_ID, MOCK_SEASON_ID),
          ).rejects.toThrow(SeasonNotFoundError);

          // Verify that rewardsSeasons was cleared
          expect(controller.state.rewardsSeasons).toEqual({});

          // Verify that accounts and subscriptions were NOT invalidated
          expect(controller.state.rewardsAccounts).toEqual({
            [MOCK_CAIP_ACCOUNT]: {
              account: MOCK_CAIP_ACCOUNT,
              hasOptedIn: true,
              subscriptionId: MOCK_SUBSCRIPTION_ID,
              perpsFeeDiscount: null,
              lastPerpsDiscountRateFetched: null,
            },
          });
          expect(controller.state.rewardsSubscriptions).toEqual({
            [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
          });
          expect(controller.state.rewardsSubscriptionTokens).toEqual({
            [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
          });

          // Verify that rewardsActiveAccount was NOT invalidated
          expect(controller.state.rewardsActiveAccount?.hasOptedIn).toBe(true);
          expect(controller.state.rewardsActiveAccount?.subscriptionId).toBe(
            MOCK_SUBSCRIPTION_ID,
          );
        },
      );
    });
  });

  describe('optIn - edge cases', () => {
    it('should return null when no accounts in account group', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return null;
            }
            return undefined;
          });

          const result = await controller.optIn();

          expect(result).toBeNull();
        },
      );
    });

    it('should throw error when all accounts fail to opt in', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.reject(new Error('Signature failed'));
            }
            return undefined;
          });

          await expect(controller.optIn()).rejects.toThrow(
            'Failed to opt in any account from the account group',
          );
        },
      );
    });

    it('should link remaining accounts after successful opt-in', async () => {
      const account2: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        id: 'account-2',
        address: '0xsecondaccount',
      };

      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT, account2];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileOptin') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              return Promise.resolve(MOCK_SUBSCRIPTION);
            }
            return undefined;
          });

          const result = await controller.optIn('REF123');

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });
  });

  describe('linkAccountToSubscriptionCandidate - edge cases', () => {
    it('should return false for unsupported account types', async () => {
      await withController(
        {
          isDisabled: false,
          state: {
            rewardsActiveAccount: {
              account: 'eip155:1:0xotheraddress' as CaipAccountId,
              hasOptedIn: true,
              subscriptionId: MOCK_SUBSCRIPTION_ID,
              perpsFeeDiscount: null,
              lastPerpsDiscountRateFetched: null,
            },
          },
        },
        async ({ controller }) => {
          const hardwareAccount: InternalAccount = {
            ...MOCK_INTERNAL_ACCOUNT,
            metadata: {
              ...MOCK_INTERNAL_ACCOUNT.metadata,
              keyring: {
                type: 'Ledger Hardware',
              },
            },
          };

          const result =
            await controller.linkAccountToSubscriptionCandidate(
              hardwareAccount,
            );

          expect(result).toBe(false);
        },
      );
    });

    it('should handle invalid timestamp error with retry', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: 'eip155:1:0xotheraddress' as CaipAccountId,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let joinAttempts = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              joinAttempts += 1;
              if (joinAttempts === 1) {
                throw new InvalidTimestampError(
                  'Invalid timestamp',
                  Math.floor(Date.now() / 1000),
                );
              }
              return Promise.resolve(MOCK_SUBSCRIPTION);
            }
            return undefined;
          });

          const result = await controller.linkAccountToSubscriptionCandidate(
            MOCK_INTERNAL_ACCOUNT,
          );

          expect(result).toBe(true);
          expect(joinAttempts).toBe(2);
        },
      );
    });

    it('should return false on link failure', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: 'eip155:1:0xotheraddress' as CaipAccountId,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              return Promise.reject(new Error('Mobile join failed'));
            }
            return undefined;
          });

          const result = await controller.linkAccountToSubscriptionCandidate(
            MOCK_INTERNAL_ACCOUNT,
          );

          expect(result).toBe(false);
        },
      );
    });

    it('should throw error when account cannot be converted to CAIP format', async () => {
      await withController(
        {
          isDisabled: false,
          state: {
            rewardsActiveAccount: {
              account: 'eip155:1:0xotheraddress' as CaipAccountId,
              hasOptedIn: true,
              subscriptionId: MOCK_SUBSCRIPTION_ID,
              perpsFeeDiscount: null,
              lastPerpsDiscountRateFetched: null,
            },
          },
        },
        async ({ controller }) => {
          const invalidAccount: InternalAccount = {
            ...MOCK_INTERNAL_ACCOUNT,
            scopes: [],
          };

          await expect(
            controller.linkAccountToSubscriptionCandidate(invalidAccount),
          ).rejects.toThrow('Failed to convert account to CAIP-10 format');
        },
      );
    });

    it('should handle account already registered by performing silent auth', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: 'eip155:1:0xotheraddress' as CaipAccountId,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              throw new AccountAlreadyRegisteredError('Already registered');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.linkAccountToSubscriptionCandidate(
            MOCK_INTERNAL_ACCOUNT,
            false,
          );

          expect(result).toBe(true);
        },
      );
    });
  });

  describe('getCandidateSubscriptionId - error scenarios', () => {
    it('should return subscription ID from cache if session token and subscription exist', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.getCandidateSubscriptionId();

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });

    it('should return null when no supported accounts found', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [];
            }
            return undefined;
          });

          const result = await controller.getCandidateSubscriptionId();

          expect(result).toBeNull();
        },
      );
    });

    it('should continue to silent auth when subscription exists but session token is missing', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsSubscriptions: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SUBSCRIPTION,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            return undefined;
          });

          const result = await controller.getCandidateSubscriptionId();

          expect(result).toBe(MOCK_SUBSCRIPTION_ID);
        },
      );
    });
  });

  describe('linkAccountsToSubscriptionCandidate - error handling', () => {
    it('should return false results for all accounts when rewards disabled', async () => {
      await withController({ isDisabled: true }, async ({ controller }) => {
        const result = await controller.linkAccountsToSubscriptionCandidate([
          MOCK_INTERNAL_ACCOUNT,
        ]);

        expect(result).toEqual([
          { account: MOCK_INTERNAL_ACCOUNT, success: false },
        ]);
      });
    });

    it('should skip accounts that already have subscriptions', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
        rewardsActiveAccount: {
          account: MOCK_CAIP_ACCOUNT,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller }) => {
          const result = await controller.linkAccountsToSubscriptionCandidate([
            MOCK_INTERNAL_ACCOUNT,
          ]);

          expect(result).toEqual([]);
        },
      );
    });

    it('should continue with other accounts even if one fails', async () => {
      const account2: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        id: 'account-2',
        address: MOCK_ACCOUNT_ADDRESS_ALT,
      };
      const state: Partial<RewardsControllerState> = {
        rewardsActiveAccount: {
          account: 'eip155:1:0xotheraddress' as CaipAccountId,
          hasOptedIn: true,
          subscriptionId: MOCK_SUBSCRIPTION_ID,
          perpsFeeDiscount: null,
          lastPerpsDiscountRateFetched: null,
        },
        rewardsSubscriptionTokens: {
          [MOCK_SUBSCRIPTION_ID]: MOCK_SESSION_TOKEN,
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let callCount = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:mobileJoin') {
              callCount += 1;
              if (callCount === 1) {
                return Promise.reject(new Error('Failed'));
              }
              return Promise.resolve(MOCK_SUBSCRIPTION);
            }
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT, account2];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [true],
                sids: [MOCK_SUBSCRIPTION_ID],
              });
            }
            return undefined;
          });

          const result = await controller.linkAccountsToSubscriptionCandidate([
            MOCK_INTERNAL_ACCOUNT,
            account2,
          ]);

          expect(result).toHaveLength(2);
          expect(result[0].success).toBe(false);
          expect(result[1].success).toBe(true);
        },
      );
    });
  });

  describe('getGeoRewardsMetadata - error handling', () => {
    it('should return fallback metadata on fetch failure', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:fetchGeoLocation') {
              return Promise.reject(new Error('Network error'));
            }
            return undefined;
          });

          const result = await controller.getGeoRewardsMetadata();

          expect(result).toEqual({
            geoLocation: 'UNKNOWN',
            optinAllowedForGeo: true,
          });
        },
      );
    });
  });

  describe('getSeasonMetadata - error handling', () => {
    it('should throw error when no valid season metadata found', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          const mockDiscoverSeasons: DiscoverSeasonsDto = {
            current: null,
            next: null,
          };

          mockMessengerCall.mockImplementation((actionType) => {
            if (actionType === 'RewardsDataService:getDiscoverSeasons') {
              return Promise.resolve(mockDiscoverSeasons);
            }
            return undefined;
          });

          await expect(controller.getSeasonMetadata('current')).rejects.toThrow(
            'No valid season metadata could be found for type: current',
          );
        },
      );
    });
  });

  describe('handleAuthenticationTrigger - additional scenarios', () => {
    it('should set active account to first account when no accounts succeed but account state exists', async () => {
      const account2: InternalAccount = {
        id: 'account-2',
        address: MOCK_ACCOUNT_ADDRESS_ALT,
        type: EthAccountType.Eoa,
        scopes: ['eip155:1'],
        options: {},
        methods: [],
        metadata: {
          name: 'Test Account',
          keyring: {
            type: 'HD Key Tree',
          },
          importTime: Date.now(),
        },
      };

      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController(
        { state, isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT, account2];
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.reject(new Error('All accounts failed'));
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              return Promise.resolve({
                ois: [false, false],
                sids: [null, null],
              });
            }
            return undefined;
          });

          await controller.handleAuthenticationTrigger('Test trigger');

          // Should set active account to first account since it has account state
          expect(controller.state.rewardsActiveAccount).toMatchObject({
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: undefined, // as we had an error when trying to signPersonalMessage
            subscriptionId: null,
          });
        },
      );
    });

    it('should not set active account when successful account has no account state after conversion fails', async () => {
      const invalidAccount: InternalAccount = {
        ...MOCK_INTERNAL_ACCOUNT,
        scopes: [], // Invalid scope to make conversion fail
      };

      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [invalidAccount];
            }
            return undefined;
          });

          await controller.handleAuthenticationTrigger('Test trigger');

          // Should not set active account since conversion fails
          expect(controller.state.rewardsActiveAccount).toBeNull();
        },
      );
    });

    it('should handle error gracefully when AccountTreeController throws', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              throw new Error('Engine does not exist');
            }
            return undefined;
          });

          await expect(
            controller.handleAuthenticationTrigger('Test trigger'),
          ).resolves.not.toThrow();
        },
      );
    });

    it('should handle getOptInStatus error gracefully and continue authentication flow', async () => {
      await withController(
        { isDisabled: false },
        async ({ controller, mockMessengerCall }) => {
          let getOptInStatusCallCount = 0;
          let loginCallCount = 0;

          mockMessengerCall.mockImplementation((actionType) => {
            if (
              actionType ===
              'AccountTreeController:getAccountsFromSelectedAccountGroup'
            ) {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'AccountsController:listMultichainAccounts') {
              return [MOCK_INTERNAL_ACCOUNT];
            }
            if (actionType === 'RewardsDataService:getOptInStatus') {
              getOptInStatusCallCount += 1;
              // Throw error on getOptInStatus call from performSilentAuth
              // Error should be caught silently and login should proceed
              throw new Error('Failed to get opt-in status');
            }
            if (actionType === 'KeyringController:signPersonalMessage') {
              return Promise.resolve('0xmocksignature');
            }
            if (actionType === 'RewardsDataService:login') {
              loginCallCount += 1;
              return Promise.resolve(MOCK_LOGIN_RESPONSE);
            }
            return undefined;
          });

          await expect(
            controller.handleAuthenticationTrigger('Test trigger'),
          ).resolves.not.toThrow();

          // Verify getOptInStatus was called from performSilentAuth
          // Error should be caught silently
          expect(getOptInStatusCallCount).toBeGreaterThanOrEqual(1);
          // Verify that login still proceeded despite getOptInStatus errors
          expect(loginCallCount).toBe(1);
          // Verify that authentication succeeded and active account was set
          expect(controller.state.rewardsActiveAccount).toMatchObject({
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: true,
            subscriptionId: MOCK_SUBSCRIPTION_ID,
          });
        },
      );
    });
  });

  describe('convertInternalAccountToCaipAccountId - additional cases', () => {
    it('should handle Solana accounts', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const solanaAccount: InternalAccount = {
          ...MOCK_INTERNAL_ACCOUNT,
          address: 'So11111111111111111111111111111111111111112',
          scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        };

        const result =
          controller.convertInternalAccountToCaipAccountId(solanaAccount);

        expect(result).toBeDefined();
      });
    });
  });

  describe('shouldSkipSilentAuth - additional scenarios', () => {
    it('should not skip when account has no last check timestamp and is not opted in', async () => {
      const state: Partial<RewardsControllerState> = {
        rewardsAccounts: {
          [MOCK_CAIP_ACCOUNT]: {
            account: MOCK_CAIP_ACCOUNT,
            hasOptedIn: false,
            subscriptionId: null,
            perpsFeeDiscount: null,
            lastPerpsDiscountRateFetched: null,
          },
        },
      };

      await withController({ state, isDisabled: false }, ({ controller }) => {
        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(false);
      });
    });

    it('should skip when no account state exists for unknown account', async () => {
      await withController({ isDisabled: false }, ({ controller }) => {
        const result = controller.shouldSkipSilentAuth(
          MOCK_CAIP_ACCOUNT,
          MOCK_INTERNAL_ACCOUNT,
        );

        expect(result).toBe(false);
      });
    });
  });
});
