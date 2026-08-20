import { Mutex } from 'async-mutex';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { SupportedCurrency } from '@metamask/core-backend';
import { AccountImportStrategy } from '@metamask/keyring-controller';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import { QrKeyring } from '@metamask/eth-qr-keyring';
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import {
  add0x,
  hexToBytes,
  parseCaipChainId,
  toCaipAccountId,
  type Hex,
} from '@metamask/utils';
import {
  EncAccountDataType,
  SecretType,
  RecoveryError,
  SeedlessOnboardingControllerErrorMessage,
} from '@metamask/seedless-onboarding-controller';
import {
  BtcAccountType,
  SolAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { PermissionsRequestNotFoundError } from '@metamask/permission-controller';
import { ApprovalRequestNotFoundError } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapId } from '@metamask/snaps-sdk';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { HardwareDeviceNames } from '../../../shared/constants/hardware-wallets';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { createSentryError } from '../../../shared/lib/error';
import { captureException } from '../../../shared/lib/sentry';
import { getIsShieldSubscriptionActive } from '../../../shared/lib/shield/subscription-utils';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS } from '../../../shared/constants/passkey';
import { DecodedTransactionDataSource } from '../../../shared/types/transaction-decode';
import { enforceSimulations } from '../lib/transaction/containers/enforced-simulations';
import { isSendBundleSupported } from '../lib/transaction/sentinel-api';
import { isRelaySupported } from '../lib/transaction/transaction-relay';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { decodeTransactionData } from '../lib/transaction/decode/util';
import { openUpdateTabAndReload } from '../lib/open-update-tab-and-reload';
import { HardwareWalletType } from '../../../shared/lib/hardware-wallets';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../shared/constants/defi-referrals';
import { ReferralStatus } from '../controllers/preferences-controller';
import { ReferralTriggerType } from '../lib/defi-referrals/createDefiReferralMiddleware';
import { checkGmxHasReferralCode } from '../lib/defi-referrals/referral-onchain-check';
import { checkHyperliquidHasReferralCode } from '../lib/defi-referrals/referral-api-check';
import { trackEvent } from '../controllers/analytics';
import { createTestProviderTools } from '../../../test/stub/provider';
import {
  HARDWARE_DEVICE_READ_TIMEOUT_MS,
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger,
} from './legacy-background-api-service';

jest.unmock('../../../shared/lib/assets-unify-state/remote-feature-flag');

const mockToHardwareWalletError = jest.fn();
const mockIsUserRejectedHardwareWalletError = jest.fn().mockReturnValue(false);

jest.mock('../../../shared/lib/hardware-wallets', () => ({
  ...jest.requireActual('../../../shared/lib/hardware-wallets'),
  toHardwareWalletError: (...args: unknown[]) =>
    mockToHardwareWalletError(...args),
  isUserRejectedHardwareWalletError: (...args: unknown[]) =>
    mockIsUserRejectedHardwareWalletError(...args),
}));

jest.mock('../lib/transaction/containers/enforced-simulations');

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({})),
}));

const mockGetManifestFlags = jest.mocked(getManifestFlags);

jest.mock('../../../shared/lib/shield/subscription-utils', () => ({
  ...jest.requireActual('../../../shared/lib/shield/subscription-utils'),
  getIsShieldSubscriptionActive: jest.fn(),
}));

const mockGetIsShieldSubscriptionActive = jest.mocked(
  getIsShieldSubscriptionActive,
);

jest.mock('../controllers/analytics', () => ({
  ...jest.requireActual('../controllers/analytics'),
  trackEvent: jest.fn(),
}));

jest.mock('../lib/defi-referrals/referral-onchain-check', () => ({
  checkGmxHasReferralCode: jest.fn().mockResolvedValue(false),
}));

jest.mock('../lib/defi-referrals/referral-api-check', () => ({
  checkHyperliquidHasReferralCode: jest.fn().mockResolvedValue(false),
}));

jest.mock('../lib/transaction/sentinel-api');
jest.mock('../lib/transaction/transaction-relay');
jest.mock('../lib/transaction/decode/util');
jest.mock('../lib/open-update-tab-and-reload');
jest.mock('../../../shared/lib/sentry');
jest.mock('../../../shared/lib/trace', () => ({
  ...jest.requireActual('../../../shared/lib/trace'),
  trace: jest.fn(),
  endTrace: jest.fn(),
}));

describe('LegacyBackgroundApiService', () => {
  it('initializes a new instance of LegacyBackgroundApiService', async () => {
    await withService(async ({ service }) => {
      expect(service).toBeInstanceOf(LegacyBackgroundApiService);
    });
  });

  describe('isAssetsUnifyStateEnabled', () => {
    it('returns false when the feature flag is undefined', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({ RemoteFeatureFlags: {} }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isAssetsUnifyStateEnabled',
        );

        expect(result).toStrictEqual(true);
      });
    });

    it('returns false when the feature flag is disabled', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: false, featureVersion: '1' },
            },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isAssetsUnifyStateEnabled',
        );

        expect(result).toStrictEqual(true);
      });
    });

    it('returns false when the feature flag has an unsupported version', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '2' },
            },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isAssetsUnifyStateEnabled',
        );

        expect(result).toStrictEqual(true);
      });
    });

    it('returns true when the feature flag is enabled with the correct version', async () => {
      await withService(({ rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'true';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '1' },
            },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isAssetsUnifyStateEnabled',
        );

        expect(result).toStrictEqual(true);
      });
    });

    it('returns false when the feature flag is enabled but the build gate is disabled', async () => {
      await withService(({ rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '1' },
            },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isAssetsUnifyStateEnabled',
        );

        expect(result).toStrictEqual(false);
      });
    });
  });

  describe('setCurrentCurrency', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Clear the require cache and resets process.env before each test to ensure a clean environment.
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      // Restore original environment
      process.env = originalEnv;
    });

    it('sets the currency in the CurrencyRateController', async () => {
      const currencyCode: SupportedCurrency = 'usd';

      await withService(async ({ serviceMessenger, rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: false, featureVersion: '1' },
            },
          }),
        );

        rootMessenger.registerActionHandler(
          'CurrencyRateController:setCurrentCurrency',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:setCurrentCurrency',
            currencyCode,
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'CurrencyRateController:setCurrentCurrency',
          currencyCode,
        );
      });
    });

    it('sets the currency in the AssetsController and CurrencyRateController when assets unify state is enabled', async () => {
      const currencyCode: SupportedCurrency = 'usd';

      await withService(async ({ serviceMessenger, rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'true';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '1' },
            },
          }),
        );

        rootMessenger.registerActionHandler(
          'CurrencyRateController:setCurrentCurrency',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'AssetsController:setSelectedCurrency',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:setCurrentCurrency',
            currencyCode,
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'CurrencyRateController:setCurrentCurrency',
          currencyCode,
        );

        expect(callSpy).toHaveBeenCalledWith(
          'AssetsController:setSelectedCurrency',
          currencyCode,
        );
      });
    });
  });

  describe('getAssets', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('fetches assets from the AssetsController with forceUpdate when the feature is enabled', async () => {
      const accounts = [{ id: 'account-1' }] as never;
      const options = { chainIds: ['eip155:1'] };
      const assets = { 'account-1': {} };

      await withService(async ({ serviceMessenger, rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'true';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '1' },
            },
          }),
        );

        const getAssetsHandler = jest.fn().mockResolvedValue(assets);
        rootMessenger.registerActionHandler(
          'AssetsController:getAssets',
          getAssetsHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:getAssets',
            accounts,
            options as never,
          ),
        ).resolves.toStrictEqual(assets);

        expect(callSpy).toHaveBeenCalledWith(
          'AssetsController:getAssets',
          accounts,
          {
            ...options,
            forceUpdate: true,
          },
        );
      });
    });

    it('resolves to undefined and does not call the AssetsController when the feature is not enabled', async () => {
      const accounts = [{ id: 'account-1' }] as never;

      await withService(async ({ serviceMessenger, rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';

        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({
            remoteFeatureFlags: {
              assetsUnifyState: { enabled: true, featureVersion: '1' },
            },
          }),
        );

        const getAssetsHandler = jest.fn();
        rootMessenger.registerActionHandler(
          'AssetsController:getAssets',
          getAssetsHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call('LegacyBackgroundApiService:getAssets', accounts),
        ).resolves.toBeUndefined();

        expect(callSpy).not.toHaveBeenCalledWith(
          'AssetsController:getAssets',
          expect.anything(),
          expect.anything(),
        );
        expect(getAssetsHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('getTokenStandardAndDetails', () => {
    it('gets token data from the token list and a balance retrieved via the global provider', async () => {
      const providerResultStub = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_getCode: '0x123',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        eth_call:
          '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
      };
      const { provider } = createTestProviderTools({
        scaffold: providerResultStub,
        networkId: '5',
        chainId: '5',
      });

      await withService(async ({ rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({ remoteFeatureFlags: {} }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({ selectedNetworkClientId: 'client' }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest
            .fn()
            .mockReturnValue({ configuration: { chainId: '0x5' }, provider }),
        );
        rootMessenger.registerActionHandler(
          'TokenListController:getState',
          jest.fn().mockReturnValue({
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0x6b175474e89094c44da98b954eedeac495271d0f': {
                    decimals: 18,
                    symbol: 'DAI',
                  },
                },
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'TokensController:getState',
          jest.fn().mockReturnValue({ allTokens: {} }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getTokenStandardAndDetails',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          '0xf0d172594caedee459b89ad44c94098e474571b6',
        );

        expect(result.standard).toStrictEqual('ERC20');
        expect(result.decimals).toStrictEqual('18');
        expect(result.symbol).toStrictEqual('DAI');
        expect(result.balance).toStrictEqual('3000000000000000000');
      });
    });

    it('falls back to the AssetsContractController when the token is not in any list', async () => {
      await withService(async ({ rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({ remoteFeatureFlags: {} }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({ selectedNetworkClientId: 'client' }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({ configuration: { chainId: '0x5' } }),
        );
        rootMessenger.registerActionHandler(
          'TokenListController:getState',
          jest.fn().mockReturnValue({ tokensChainsCache: {} }),
        );
        rootMessenger.registerActionHandler(
          'TokensController:getState',
          jest.fn().mockReturnValue({ allTokens: {} }),
        );
        const getTokenStandardAndDetails = jest.fn().mockResolvedValue({
          standard: 'ERC20',
          decimals: '18',
          symbol: 'DAI',
          balance: 333,
        });
        rootMessenger.registerActionHandler(
          'AssetsContractController:getTokenStandardAndDetails',
          getTokenStandardAndDetails,
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getTokenStandardAndDetails',
          '0xNotInTokenList',
          '0xf0d172594caedee459b89ad44c94098e474571b6',
        );

        expect(getTokenStandardAndDetails).toHaveBeenCalled();
        expect(result.standard).toStrictEqual('ERC20');
        expect(result.decimals).toStrictEqual('18');
        expect(result.balance).toStrictEqual('333');
      });
    });
  });

  describe('getTokenStandardAndDetailsByChain', () => {
    it('falls back to the AssetsContractController using the chain-resolved network client id', async () => {
      const getTokenStandardAndDetails = jest.fn().mockResolvedValue({
        standard: 'ERC20',
        decimals: '18',
        symbol: 'DAI',
        balance: 333,
      });

      await withService(async ({ rootMessenger }) => {
        process.env.ASSETS_UNIFIED_STATE_ENABLED = 'false';
        rootMessenger.registerActionHandler(
          'RemoteFeatureFlagController:getState',
          jest.fn().mockReturnValue({ remoteFeatureFlags: {} }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({
            selectedNetworkClientId: 'client',
            networkConfigurationsByChainId: {
              '0x1': {
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'mainnet' }],
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({ configuration: { chainId: '0x5' } }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getSelectedAccount',
          jest.fn().mockReturnValue({ address: '0xabc' }),
        );
        rootMessenger.registerActionHandler(
          'TokenListController:getState',
          jest.fn().mockReturnValue({ tokensChainsCache: {} }),
        );
        rootMessenger.registerActionHandler(
          'TokensController:getState',
          jest.fn().mockReturnValue({ allTokens: {} }),
        );
        rootMessenger.registerActionHandler(
          'AssetsContractController:getTokenStandardAndDetails',
          getTokenStandardAndDetails,
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getTokenStandardAndDetailsByChain',
          '0xNotInTokenList',
          '0xf0d172594caedee459b89ad44c94098e474571b6',
          undefined,
          '0x1',
        );

        expect(getTokenStandardAndDetails).toHaveBeenCalledWith(
          '0xNotInTokenList',
          '0xf0d172594caedee459b89ad44c94098e474571b6',
          undefined,
          'mainnet',
        );
        expect(result.standard).toStrictEqual('ERC20');
        expect(result.balance).toStrictEqual('333');
      });
    });
  });

  describe('getTokenSymbol', () => {
    it('returns the token symbol from the AssetsContractController', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'AssetsContractController:getTokenStandardAndDetails',
          jest.fn().mockResolvedValue({ standard: 'ERC20', symbol: 'DAI' }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getTokenSymbol',
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        );

        expect(result).toStrictEqual('DAI');
      });
    });

    it('returns null when the lookup throws', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'AssetsContractController:getTokenStandardAndDetails',
          jest.fn().mockRejectedValue(new Error('error')),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getTokenSymbol',
          '0xNotInTokenList',
        );

        expect(result).toBeNull();
      });
    });
  });

  describe('isPublicEndpointUrl', () => {
    it('returns true for a public endpoint URL', async () => {
      await withService(({ rootMessenger }) => {
        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isPublicEndpointUrl',
          'https://mainnet.infura.io/v3/test-infura-project-id',
        );
        expect(result).toStrictEqual(true);
      });
    });

    it('returns false for a non-public endpoint URL', async () => {
      await withService(({ rootMessenger }) => {
        const result = rootMessenger.call(
          'LegacyBackgroundApiService:isPublicEndpointUrl',
          'https://my-private-node.com',
        );
        expect(result).toStrictEqual(false);
      });
    });
  });

  describe('getRequestAccountTabIds', () => {
    it('returns the record of request account tab IDs', async () => {
      const mockTabIds = { '0x123': 1, '0x456': 2 };
      const mockGetRequestAccountTabIds = jest.fn().mockReturnValue(mockTabIds);

      await withService(
        {
          options: {
            getRequestAccountTabIds: mockGetRequestAccountTabIds,
          },
        },
        ({ rootMessenger }) => {
          const result = rootMessenger.call(
            'LegacyBackgroundApiService:getRequestAccountTabIds',
          );

          expect(result).toEqual(mockTabIds);
          expect(mockGetRequestAccountTabIds).toHaveBeenCalled();
        },
      );
    });
  });

  describe('getOpenMetamaskTabsIds', () => {
    it('returns the record of open MetaMask tab IDs', async () => {
      const mockTabIds = { '0x123': 1, '0x456': 2 };
      const mockGetOpenMetamaskTabsIds = jest.fn().mockReturnValue(mockTabIds);

      await withService(
        {
          options: {
            getOpenMetamaskTabsIds: mockGetOpenMetamaskTabsIds,
          },
        },
        ({ rootMessenger }) => {
          const result = rootMessenger.call(
            'LegacyBackgroundApiService:getOpenMetamaskTabsIds',
          );

          expect(result).toEqual(mockTabIds);
          expect(mockGetOpenMetamaskTabsIds).toHaveBeenCalled();
        },
      );
    });
  });

  describe('requestSafeReload', () => {
    it('triggers a safe reload of the extension', async () => {
      const mockRequestSafeReload = jest.fn().mockResolvedValue(undefined);

      await withService(
        {
          options: {
            requestSafeReload: mockRequestSafeReload,
          },
        },
        async ({ rootMessenger }) => {
          await rootMessenger.call(
            'LegacyBackgroundApiService:requestSafeReload',
          );

          expect(mockRequestSafeReload).toHaveBeenCalled();
        },
      );
    });
  });

  describe('openUpdateTabAndReload', () => {
    it('opens the update tab and reloads with the injected requestSafeReload', async () => {
      const mockRequestSafeReload = jest.fn().mockResolvedValue(undefined);
      jest.mocked(openUpdateTabAndReload).mockResolvedValue(undefined);

      await withService(
        {
          options: {
            requestSafeReload: mockRequestSafeReload,
          },
        },
        async ({ rootMessenger }) => {
          await rootMessenger.call(
            'LegacyBackgroundApiService:openUpdateTabAndReload',
          );

          expect(openUpdateTabAndReload).toHaveBeenCalledWith(
            mockRequestSafeReload,
          );
        },
      );
    });
  });

  describe('getPhishingResult', () => {
    it('updates the phishing state and returns the test result for the website', async () => {
      const website = 'https://example.com';
      const phishingResult = { result: false, type: 'all' };
      const mockMaybeUpdateState = jest.fn();
      const mockTestOrigin = jest.fn().mockReturnValue(phishingResult);

      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'PhishingController:maybeUpdateState',
          mockMaybeUpdateState,
        );
        rootMessenger.registerActionHandler(
          'PhishingController:testOrigin',
          mockTestOrigin,
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getPhishingResult',
          website,
        );

        expect(mockMaybeUpdateState).toHaveBeenCalled();
        expect(mockTestOrigin).toHaveBeenCalledWith(website);
        expect(result).toBe(phishingResult);
      });
    });
  });

  describe('markNotificationPopupAsAutomaticallyClosed', () => {
    it('marks the notification popup as automatically closed', async () => {
      const mockMarkNotificationPopupAsAutomaticallyClosed = jest.fn();

      await withService(
        {
          options: {
            markNotificationPopupAsAutomaticallyClosed:
              mockMarkNotificationPopupAsAutomaticallyClosed,
          },
        },
        ({ rootMessenger }) => {
          rootMessenger.call(
            'LegacyBackgroundApiService:markNotificationPopupAsAutomaticallyClosed',
          );

          expect(
            mockMarkNotificationPopupAsAutomaticallyClosed,
          ).toHaveBeenCalled();
        },
      );
    });
  });

  describe('markPasswordForgotten', () => {
    it('sets the preference and triggers an update', async () => {
      const mockSendUpdate = jest.fn();

      await withService(
        {
          options: {
            sendUpdate: mockSendUpdate,
          },
        },
        ({ rootMessenger, serviceMessenger }) => {
          const callSpy = jest.spyOn(serviceMessenger, 'call');

          rootMessenger.registerActionHandler(
            'PreferencesController:setPasswordForgotten',
            jest.fn(),
          );

          rootMessenger.call(
            'LegacyBackgroundApiService:markPasswordForgotten',
          );

          expect(callSpy).toHaveBeenCalledWith(
            'PreferencesController:setPasswordForgotten',
            true,
          );
          expect(mockSendUpdate).toHaveBeenCalled();
        },
      );
    });
  });

  describe('unMarkPasswordForgotten', () => {
    it('sets the preference and triggers an update', async () => {
      const mockSendUpdate = jest.fn();

      await withService(
        {
          options: {
            sendUpdate: mockSendUpdate,
          },
        },
        ({ rootMessenger, serviceMessenger }) => {
          const callSpy = jest.spyOn(serviceMessenger, 'call');

          rootMessenger.registerActionHandler(
            'PreferencesController:setPasswordForgotten',
            jest.fn(),
          );

          rootMessenger.call(
            'LegacyBackgroundApiService:unMarkPasswordForgotten',
          );

          expect(callSpy).toHaveBeenCalledWith(
            'PreferencesController:setPasswordForgotten',
            false,
          );

          expect(mockSendUpdate).toHaveBeenCalled();
        },
      );
    });
  });

  describe('getCode', () => {
    it('returns the code of a contract at a given address for a specific network client', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({
            provider: {
              request: jest.fn().mockResolvedValue('0x123'),
            },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:getCode',
          '0x123',
          'networkClientId',
        );

        expect(result).resolves.toStrictEqual('0x123');
      });
    });
  });

  describe('hardware wallets', () => {
    /**
     * Registers a `KeyringController:withKeyringV2` handler that invokes its
     * callback with the given mocked keyring, so tests can exercise the
     * hardware methods that route through `#withKeyringForDevice`.
     *
     * @param rootMessenger - The root messenger to register the handler on.
     * @param keyring - The mocked keyring to pass to the callback.
     */
    function registerWithKeyringV2(
      rootMessenger: RootMessenger,
      keyring: Record<string, unknown>,
    ): void {
      // Read methods run their callback through `withKeyringV2Unsafe` (the
      // lock-free device-read path) while still preparing the keyring under
      // `withKeyringV2`; mutating methods (`forgetDevice`,
      // `unlockHardwareWalletAccount`) use `withKeyringV2` only. Registering
      // both with the same mock keyring covers every path.
      const handler = jest
        .fn()
        .mockImplementation((_selector, callback) => callback({ keyring }));
      rootMessenger.registerActionHandler(
        'KeyringController:withKeyringV2',
        handler,
      );
      rootMessenger.registerActionHandler(
        'KeyringController:withKeyringV2Unsafe',
        handler,
      );
    }

    describe('connectHardware', () => {
      it('throws if it receives an unknown device name', async () => {
        await withService(async ({ rootMessenger }) => {
          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:connectHardware',
              'Some random device name',
              0,
              `m/44/0'/0'`,
            ),
          ).rejects.toThrow(
            'LegacyBackgroundApiService:#withKeyringForDevice - Unknown device',
          );
        });
      });

      it('adds the Ledger keyring if missing and returns the first page of accounts', async () => {
        await withService(async ({ rootMessenger }) => {
          const getFirstPage = jest
            .fn()
            .mockResolvedValue([{ address: '0x1', balance: null, index: 0 }]);
          const bridge = { updateTransportMethod: jest.fn() };
          const addNewKeyring = jest.fn();

          const withController = jest
            .fn()
            .mockImplementation(async (callback) =>
              callback({ keyrings: [], addNewKeyring }),
            );
          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            withController,
          );

          registerWithKeyringV2(rootMessenger, {
            bridge,
            getFirstPage,
            getPreviousPage: jest.fn(),
            getNextPage: jest.fn(),
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:connectHardware',
            'ledger',
            0,
          );

          expect(withController).toHaveBeenCalled();
          // The keyring does not exist yet, so it is created.
          expect(addNewKeyring).toHaveBeenCalledWith(LedgerKeyring.type);
          expect(getFirstPage).toHaveBeenCalled();
          expect(result).toStrictEqual([
            { address: '0x1', balance: null, index: 0 },
          ]);
        });
      });

      it('adds the Trezor keyring if missing and returns the first page of accounts', async () => {
        await withService(async ({ rootMessenger }) => {
          const getFirstPage = jest
            .fn()
            .mockResolvedValue([{ address: '0x2', balance: null, index: 0 }]);
          const addNewKeyring = jest.fn();

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring }),
              ),
          );
          rootMessenger.registerActionHandler(
            'AppStateController:setTrezorModel',
            jest.fn(),
          );

          registerWithKeyringV2(rootMessenger, {
            getModel: jest.fn().mockReturnValue('model-t'),
            getFirstPage,
            getPreviousPage: jest.fn(),
            getNextPage: jest.fn(),
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:connectHardware',
            'trezor',
            0,
          );

          expect(addNewKeyring).toHaveBeenCalledWith(TrezorKeyring.type);
          expect(result).toStrictEqual([
            { address: '0x2', balance: null, index: 0 },
          ]);
        });
      });

      it('returns the next / previous page based on the page argument', async () => {
        await withService(async ({ rootMessenger }) => {
          const getNextPage = jest.fn().mockResolvedValue([{ index: 1 }]);
          const getPreviousPage = jest.fn().mockResolvedValue([{ index: -1 }]);

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring: jest.fn() }),
              ),
          );

          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            getFirstPage: jest.fn(),
            getNextPage,
            getPreviousPage,
          });

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:connectHardware',
              'ledger',
              1,
            ),
          ).resolves.toStrictEqual([{ index: 1 }]);

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:connectHardware',
              'ledger',
              -1,
            ),
          ).resolves.toStrictEqual([{ index: -1 }]);
        });
      });
    });

    describe('#setLedgerTransportPreference (via connectHardware)', () => {
      /**
       * Runs a ledger `connectHardware` with the given bridge, which routes
       * through `#setLedgerTransportPreference`.
       *
       * @param rootMessenger - The root messenger to register handlers on.
       * @param bridge - The mocked keyring bridge.
       */
      async function connectLedgerWithBridge(
        rootMessenger: RootMessenger,
        bridge: Record<string, unknown>,
      ): Promise<void> {
        rootMessenger.registerActionHandler(
          'KeyringController:withController',
          jest
            .fn()
            .mockImplementation(async (callback) =>
              callback({ keyrings: [], addNewKeyring: jest.fn() }),
            ),
        );
        registerWithKeyringV2(rootMessenger, {
          bridge,
          getFirstPage: jest.fn().mockResolvedValue([]),
          getNextPage: jest.fn(),
          getPreviousPage: jest.fn(),
        });

        await rootMessenger.call(
          'LegacyBackgroundApiService:connectHardware',
          'ledger',
          0,
        );
      }

      it('calls the bridge transport update when available', async () => {
        await withService(async ({ rootMessenger }) => {
          const updateTransportMethod = jest.fn().mockResolvedValue(true);

          await connectLedgerWithBridge(rootMessenger, {
            updateTransportMethod,
          });

          expect(updateTransportMethod).toHaveBeenCalledTimes(1);
        });
      });

      it('does nothing when the bridge does not expose transport updates', async () => {
        await withService(async ({ rootMessenger }) => {
          // A bridge without `updateTransportMethod`; connectHardware should
          // still resolve.
          await expect(
            connectLedgerWithBridge(rootMessenger, {}),
          ).resolves.toBeUndefined();
        });
      });

      it('rethrows errors from the bridge transport update', async () => {
        await withService(async ({ rootMessenger }) => {
          const error = new Error('transport failed');

          await expect(
            connectLedgerWithBridge(rootMessenger, {
              updateTransportMethod: jest.fn().mockRejectedValue(error),
            }),
          ).rejects.toThrow(error);
        });
      });

      it('times out an abandoned device read when the device wedges', async () => {
        await withService(async ({ rootMessenger }) => {
          // A wedged device leaves the page read pending forever.
          const getFirstPage = jest
            .fn()
            .mockReturnValue(new Promise(() => undefined));
          const addNewKeyring = jest.fn();

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring }),
              ),
          );

          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            getFirstPage,
          });

          // Intercept the device-read backstop timer so it can be fired
          // deterministically without faking every timer in the app.
          const originalSetTimeout = global.setTimeout;
          let fireDeviceReadTimeout: (() => void) | undefined;
          const setTimeoutSpy = jest
            .spyOn(global, 'setTimeout')
            .mockImplementation(((
              handler: () => void,
              timeout?: number,
              ...args: unknown[]
            ) => {
              if (timeout === HARDWARE_DEVICE_READ_TIMEOUT_MS) {
                fireDeviceReadTimeout = handler;
                return 0 as unknown as ReturnType<typeof setTimeout>;
              }
              return originalSetTimeout(handler, timeout, ...args);
            }) as typeof setTimeout);

          try {
            const wedged = rootMessenger.call(
              'LegacyBackgroundApiService:connectHardware',
              HardwareDeviceNames.ledger,
              0,
              `m/44'/60'/0'/0`,
            );
            // Swallow the timeout rejection asserted below so the abandoned
            // read never surfaces as an unhandled rejection.
            wedged.catch(() => undefined);

            // Wait until `connectHardware` reaches the (hanging) device read.
            await new Promise<void>((resolve) => {
              const poll = () =>
                getFirstPage.mock.calls.length > 0
                  ? resolve()
                  : originalSetTimeout(poll, 5);
              poll();
            });

            fireDeviceReadTimeout?.();
            await expect(wedged).rejects.toThrow(
              'Hardware wallet device read timed out',
            );
          } finally {
            setTimeoutSpy.mockRestore();
          }
        });
      });
    });

    describe('checkHardwareStatus', () => {
      it('throws if it receives an unknown device name', async () => {
        await withService(async ({ rootMessenger }) => {
          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:checkHardwareStatus',
              'Some random device name',
              `m/44/0'/0'`,
            ),
          ).rejects.toThrow(
            'LegacyBackgroundApiService:#withKeyringForDevice - Unknown device',
          );
        });
      });

      it('returns the unlocked status of the device', async () => {
        await withService(async ({ rootMessenger }) => {
          const setHdPath = jest.fn();
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            isUnlocked: jest.fn().mockReturnValue(true),
            setHdPath,
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:checkHardwareStatus',
            'ledger',
            "m/44'/60'/0'/0",
          );

          expect(result).toStrictEqual(true);
          expect(setHdPath).toHaveBeenCalledWith("m/44'/60'/0'/0");
        });
      });

      it('creates the QR keyring before probing reconnect status', async () => {
        await withService(async ({ rootMessenger }) => {
          const addNewKeyring = jest.fn().mockResolvedValue(undefined);
          // QR keyrings report pairing via `getMode()`, not `isUnlocked()`
          // (which they do not implement).
          const getMode = jest.fn().mockReturnValue('hd');

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring }),
              ),
          );

          registerWithKeyringV2(rootMessenger, { getMode });

          const status = await rootMessenger.call(
            'LegacyBackgroundApiService:checkHardwareStatus',
            HardwareDeviceNames.qr,
            `m/44'/60'/0'/0`,
          );

          expect(status).toStrictEqual(true);
          expect(addNewKeyring).toHaveBeenCalledWith(QrKeyring.type);
          expect(getMode).toHaveBeenCalledTimes(1);
        });
      });

      it('returns false when the QR keyring is unpaired', async () => {
        await withService(async ({ rootMessenger }) => {
          const addNewKeyring = jest.fn().mockResolvedValue(undefined);
          // An unpaired QR keyring has no mode set, so `getMode()` is
          // `undefined` and the reconnect status is `false`.
          const getMode = jest.fn().mockReturnValue(undefined);

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring }),
              ),
          );

          registerWithKeyringV2(rootMessenger, { getMode });

          const status = await rootMessenger.call(
            'LegacyBackgroundApiService:checkHardwareStatus',
            HardwareDeviceNames.qr,
            `m/44'/60'/0'/0`,
          );

          expect(status).toStrictEqual(false);
          expect(getMode).toHaveBeenCalledTimes(1);
        });
      });
    });

    describe('getLedgerAppConfiguration', () => {
      it('returns the app configuration from the Ledger bridge', async () => {
        await withService(async ({ rootMessenger }) => {
          const mockConfiguration = {
            arbitraryDataEnabled: 1,
            erc20ProvisioningNecessary: 0,
            starkEnabled: 0,
            starkv2Supported: 0,
            version: '1.0.0',
          };

          const updateTransportMethod = jest.fn().mockResolvedValue(true);
          const getAppConfiguration = jest
            .fn()
            .mockResolvedValue(mockConfiguration);

          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod, getAppConfiguration },
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:getLedgerAppConfiguration',
          );

          expect(updateTransportMethod).toHaveBeenCalledTimes(1);
          expect(getAppConfiguration).toHaveBeenCalledTimes(1);
          expect(result).toStrictEqual(mockConfiguration);
        });
      });
    });

    describe('getLedgerMode', () => {
      it('returns Legacy when the ledgerDmk flag is missing', async () => {
        await withService(async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'RemoteFeatureFlagController:getState',
            () => ({
              remoteFeatureFlags: {},
              cacheTimestamp: 0,
            }),
          );

          expect(
            rootMessenger.call('LegacyBackgroundApiService:getLedgerMode'),
          ).toBe('legacy');
        });
      });

      it('returns Legacy when ledgerDmk is disabled', async () => {
        await withService(async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'RemoteFeatureFlagController:getState',
            () => ({
              remoteFeatureFlags: {
                ledgerDmk: {
                  enabled: false,
                  featureVersion: null,
                  minimumVersion: null,
                },
              },
              cacheTimestamp: 0,
            }),
          );

          expect(
            rootMessenger.call('LegacyBackgroundApiService:getLedgerMode'),
          ).toBe('legacy');
        });
      });

      it('returns DMK when ledgerDmk is enabled', async () => {
        await withService(async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'RemoteFeatureFlagController:getState',
            () => ({
              remoteFeatureFlags: {
                ledgerDmk: {
                  enabled: true,
                  featureVersion: '13.36.0',
                  minimumVersion: '13.36.0',
                },
              },
              cacheTimestamp: 0,
            }),
          );

          expect(
            rootMessenger.call('LegacyBackgroundApiService:getLedgerMode'),
          ).toBe('dmk');
        });
      });

      it('returns Legacy when RemoteFeatureFlagController state omits remoteFeatureFlags', async () => {
        await withService(async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'RemoteFeatureFlagController:getState',
            // Incomplete state on purpose to exercise the fallback path.
            () => ({}) as never,
          );

          expect(
            rootMessenger.call('LegacyBackgroundApiService:getLedgerMode'),
          ).toBe('legacy');
        });
      });

      it('returns DMK when a manifest override enables ledgerDmk', async () => {
        mockGetManifestFlags.mockReturnValue({
          remoteFeatureFlags: {
            ledgerDmk: {
              enabled: true,
              featureVersion: '13.36.0',
              minimumVersion: '13.36.0',
            },
          },
        });

        try {
          await withService(async ({ rootMessenger }) => {
            rootMessenger.registerActionHandler(
              'RemoteFeatureFlagController:getState',
              () => ({
                remoteFeatureFlags: {},
                cacheTimestamp: 0,
              }),
            );

            expect(
              rootMessenger.call('LegacyBackgroundApiService:getLedgerMode'),
            ).toBe('dmk');
          });
        } finally {
          mockGetManifestFlags.mockReturnValue({});
        }
      });
    });

    describe('forgetDevice', () => {
      it('throws if it receives an unknown device name', async () => {
        await withService(async ({ rootMessenger }) => {
          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:forgetDevice',
              'Some random device name',
            ),
          ).rejects.toThrow(
            'LegacyBackgroundApiService:#withKeyringForDevice - Unknown device',
          );
        });
      });

      it('removes each account then forgets the device', async () => {
        await withService(async ({ rootMessenger, serviceMessenger }) => {
          const forgetDevice = jest.fn().mockResolvedValue(undefined);
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            getAccounts: jest
              .fn()
              .mockResolvedValue([{ address: '0xabc' }, { address: '0xdef' }]),
            forgetDevice,
          });

          const updatePermissionsByCaveat = jest.fn();
          rootMessenger.registerActionHandler(
            'PermissionController:updatePermissionsByCaveat',
            updatePermissionsByCaveat,
          );

          const callSpy = jest.spyOn(serviceMessenger, 'call');

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:forgetDevice',
            'ledger',
          );

          expect(result).toStrictEqual(true);
          expect(forgetDevice).toHaveBeenCalled();
          // `onAccountRemoved` is invoked for each account, which delegates to
          // the permission controller. Two accounts -> two removals.
          expect(callSpy).toHaveBeenCalledWith(
            'PermissionController:updatePermissionsByCaveat',
            Caip25CaveatType,
            expect.any(Function),
          );
          expect(updatePermissionsByCaveat).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('getTrezorFeatures', () => {
      it('throws when the bridge does not support getFeatures', async () => {
        await withService(async ({ rootMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: {},
            getModel: jest.fn().mockReturnValue('model-t'),
          });
          rootMessenger.registerActionHandler(
            'AppStateController:setTrezorModel',
            jest.fn(),
          );

          await expect(
            rootMessenger.call('LegacyBackgroundApiService:getTrezorFeatures'),
          ).rejects.toThrow('Trezor bridge does not support getFeatures');
        });
      });

      it('returns the features from the bridge', async () => {
        await withService(async ({ rootMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: { getFeatures: jest.fn().mockResolvedValue({ major: 2 }) },
            getModel: jest.fn().mockReturnValue('model-t'),
          });
          rootMessenger.registerActionHandler(
            'AppStateController:setTrezorModel',
            jest.fn(),
          );

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:getTrezorFeatures',
          );

          expect(result).toStrictEqual({ major: 2 });
        });
      });
    });

    describe('unlockHardwareWalletAccount', () => {
      it('creates the account and selects it', async () => {
        await withService(async ({ rootMessenger, serviceMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            createAccounts: jest.fn().mockResolvedValue([{ address: '0xABC' }]),
          });

          rootMessenger.registerActionHandler(
            'AccountsController:listAccounts',
            jest.fn().mockReturnValue([{ id: 'account-1', address: '0xabc' }]),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:getAccountByAddress',
            jest.fn().mockReturnValue({ id: 'account-1', address: '0xabc' }),
          );
          const setSelectedAccount = jest.fn();
          rootMessenger.registerActionHandler(
            'AccountsController:setSelectedAccount',
            setSelectedAccount,
          );

          const callSpy = jest.spyOn(serviceMessenger, 'call');

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:unlockHardwareWalletAccount',
            0,
            'ledger',
            "m/44'/60'/0'/0",
          );

          expect(result.unlockedAccount).toStrictEqual('0xabc');
          expect(result.accounts).toStrictEqual([
            { id: 'account-1', address: '0xabc' },
          ]);
          expect(callSpy).toHaveBeenCalledWith(
            'AccountsController:setSelectedAccount',
            'account-1',
          );
        });
      });

      it('creates and selects the account for a Trezor device', async () => {
        await withService(async ({ rootMessenger, serviceMessenger }) => {
          const createAccounts = jest
            .fn()
            .mockResolvedValue([{ address: '0xDEF' }]);
          registerWithKeyringV2(rootMessenger, {
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            getModel: jest.fn().mockReturnValue('model-t'),
            createAccounts,
          });

          rootMessenger.registerActionHandler(
            'AppStateController:setTrezorModel',
            jest.fn(),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:listAccounts',
            jest.fn().mockReturnValue([{ id: 'account-2', address: '0xdef' }]),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:getAccountByAddress',
            jest.fn().mockReturnValue({ id: 'account-2', address: '0xdef' }),
          );
          const setSelectedAccount = jest.fn();
          rootMessenger.registerActionHandler(
            'AccountsController:setSelectedAccount',
            setSelectedAccount,
          );

          const callSpy = jest.spyOn(serviceMessenger, 'call');

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:unlockHardwareWalletAccount',
            0,
            'trezor',
          );

          expect(createAccounts).toHaveBeenCalled();
          expect(result.unlockedAccount).toStrictEqual('0xdef');
          expect(callSpy).toHaveBeenCalledWith(
            'AccountsController:setSelectedAccount',
            'account-2',
          );
        });
      });

      it('throws if it receives an unknown device name', async () => {
        await withService(async ({ rootMessenger }) => {
          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:unlockHardwareWalletAccount',
              0,
              'Some random device name',
            ),
          ).rejects.toThrow(
            'LegacyBackgroundApiService:#withKeyringForDevice - Unknown device',
          );
        });
      });

      it('throws if the keyring does not create an account', async () => {
        await withService(async ({ rootMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            createAccounts: jest.fn().mockResolvedValue([]),
          });

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:unlockHardwareWalletAccount',
              0,
              'ledger',
            ),
          ).rejects.toThrow('No account created for device: ledger');
        });
      });

      it('throws when the unlocked account cannot be found', async () => {
        await withService(async ({ rootMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            createAccounts: jest.fn().mockResolvedValue([{ address: '0xABC' }]),
          });

          rootMessenger.registerActionHandler(
            'AccountsController:listAccounts',
            jest.fn().mockReturnValue([]),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:getAccountByAddress',
            jest.fn().mockReturnValue(undefined),
          );

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:unlockHardwareWalletAccount',
              0,
              'ledger',
              "m/44'/60'/0'/0",
            ),
          ).rejects.toThrow('No account found for address: 0xabc');
        });
      });

      it('creates and selects the account for a QR device in account mode', async () => {
        await withService(async ({ rootMessenger }) => {
          const createAccounts = jest
            .fn()
            .mockResolvedValue([{ address: '0x111' }]);
          registerWithKeyringV2(rootMessenger, {
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            getMode: jest.fn().mockReturnValue('account'),
            getName: jest.fn().mockReturnValue('QR Hardware'),
            createAccounts,
          });

          rootMessenger.registerActionHandler(
            'AccountsController:listAccounts',
            jest.fn().mockReturnValue([{ id: 'qr-1', address: '0x111' }]),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:getAccountByAddress',
            jest.fn().mockReturnValue({ id: 'qr-1', address: '0x111' }),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:setSelectedAccount',
            jest.fn(),
          );

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:unlockHardwareWalletAccount',
            0,
            'QR Hardware',
          );

          expect(createAccounts).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'custom', addressIndex: 0 }),
          );
          expect(result.unlockedAccount).toStrictEqual('0x111');
        });
      });

      it('creates the account for a QR device in HD mode', async () => {
        await withService(async ({ rootMessenger }) => {
          const createAccounts = jest
            .fn()
            .mockResolvedValue([{ address: '0x222' }]);
          registerWithKeyringV2(rootMessenger, {
            entropySource: 'entropy-1',
            hdPath: "m/44'/60'/0'/0",
            getMode: jest.fn().mockReturnValue('hd'),
            getName: jest.fn().mockReturnValue('QR Hardware'),
            createAccounts,
          });

          rootMessenger.registerActionHandler(
            'AccountsController:listAccounts',
            jest.fn().mockReturnValue([]),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:getAccountByAddress',
            jest.fn().mockReturnValue({ id: 'qr-2', address: '0x222' }),
          );
          rootMessenger.registerActionHandler(
            'AccountsController:setSelectedAccount',
            jest.fn(),
          );

          await rootMessenger.call(
            'LegacyBackgroundApiService:unlockHardwareWalletAccount',
            0,
            'QR Hardware',
          );

          expect(createAccounts).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'bip44:derive-index',
              groupIndex: 0,
            }),
          );
        });
      });
    });

    describe('attemptLedgerTransportCreation', () => {
      it('creates the Ledger transport app', async () => {
        await withService(async ({ rootMessenger }) => {
          const attemptMakeApp = jest.fn().mockResolvedValue(true);
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            attemptMakeApp,
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:attemptLedgerTransportCreation',
          );

          expect(attemptMakeApp).toHaveBeenCalled();
          expect(result).toBe(true);
        });
      });
    });

    describe('getAppNameAndVersion', () => {
      it('returns the app name and version from the Ledger device', async () => {
        await withService(async ({ rootMessenger }) => {
          const appInfo = { appName: 'Ethereum', version: '1.0.0' };
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            getAppNameAndVersion: jest.fn().mockResolvedValue(appInfo),
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:getAppNameAndVersion',
          );

          expect(result).toStrictEqual(appInfo);
        });
      });
    });

    describe('getHdPathForLedgerKeyring', () => {
      it('returns the configured hd path', async () => {
        await withService(async ({ rootMessenger }) => {
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            hdPath: "m/44'/60'/0'/0",
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:getHdPathForLedgerKeyring',
          );

          expect(result).toStrictEqual("m/44'/60'/0'/0");
        });
      });
    });

    describe('getLedgerPublicKey', () => {
      it('returns the public key for the given hd path', async () => {
        await withService(async ({ rootMessenger }) => {
          const publicKey = { publicKey: '0xpub', address: '0xabc' };
          const getPublicKey = jest.fn().mockResolvedValue(publicKey);
          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn(), getPublicKey },
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:getLedgerPublicKey',
            "m/44'/60'/0'/0",
          );

          expect(getPublicKey).toHaveBeenCalledWith({
            hdPath: "m/44'/60'/0'/0",
          });
          expect(result).toStrictEqual(publicKey);
        });
      });
    });

    describe('#withKeyringForDevice additional coverage', () => {
      it('adds the OneKey keyring if missing and returns the first page', async () => {
        await withService(async ({ rootMessenger }) => {
          const getFirstPage = jest.fn().mockResolvedValue([{ index: 0 }]);
          const addNewKeyring = jest.fn();

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest
              .fn()
              .mockImplementation(async (callback) =>
                callback({ keyrings: [], addNewKeyring }),
              ),
          );
          rootMessenger.registerActionHandler(
            'AppStateController:setTrezorModel',
            jest.fn(),
          );

          registerWithKeyringV2(rootMessenger, {
            getModel: jest.fn().mockReturnValue('onekey-model'),
            getFirstPage,
            getNextPage: jest.fn(),
            getPreviousPage: jest.fn(),
          });

          const result = await rootMessenger.call(
            'LegacyBackgroundApiService:connectHardware',
            'oneKey',
            0,
          );

          expect(addNewKeyring).toHaveBeenCalledWith(OneKeyKeyring.type);
          expect(result).toStrictEqual([{ index: 0 }]);
        });
      });

      it('does not create the keyring when it already exists', async () => {
        await withService(async ({ rootMessenger }) => {
          const addNewKeyring = jest.fn();

          rootMessenger.registerActionHandler(
            'KeyringController:withController',
            jest.fn().mockImplementation(async (callback) =>
              callback({
                keyrings: [{ type: LedgerKeyring.type }],
                addNewKeyring,
              }),
            ),
          );

          registerWithKeyringV2(rootMessenger, {
            bridge: { updateTransportMethod: jest.fn() },
            getFirstPage: jest.fn().mockResolvedValue([]),
            getNextPage: jest.fn(),
            getPreviousPage: jest.fn(),
          });

          await rootMessenger.call(
            'LegacyBackgroundApiService:connectHardware',
            'ledger',
            0,
          );

          expect(addNewKeyring).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('checkDelegationDisabled', () => {
    it('performs an eth_call against the delegation manager and returns the decoded result', async () => {
      const delegationManagerAddress: Hex =
        '0x1234567890123456789012345678901234567890';
      const delegationHash: Hex = `0x${'0'.repeat(63)}1`;
      const mockRequest = jest
        .fn()
        .mockResolvedValue(
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        );

      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({
            provider: { request: mockRequest },
          }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkDelegationDisabled',
          delegationManagerAddress,
          delegationHash,
          'networkClientId',
        );

        expect(mockRequest).toHaveBeenCalledWith({
          method: 'eth_call',
          params: [
            { to: delegationManagerAddress, data: expect.any(String) },
            'latest',
          ],
        });
        expect(result).toBe(true);
      });
    });
  });

  describe('getNextNonce', () => {
    it('returns the next nonce and releases the nonce lock', async () => {
      await withService(async ({ rootMessenger }) => {
        const releaseLock = jest.fn();
        rootMessenger.registerActionHandler(
          'TransactionController:getNonceLock',
          jest.fn().mockResolvedValue({
            nextNonce: 5,
            releaseLock,
          }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getNextNonce',
          '0x123',
          'networkClientId',
        );

        expect(result).toStrictEqual(5);
        expect(releaseLock).toHaveBeenCalled();
      });
    });
  });

  describe('estimateGas', () => {
    it('estimates the gas for a transaction using the selected network client', async () => {
      await withService(async ({ rootMessenger }) => {
        const request = jest.fn().mockResolvedValue(21000);
        rootMessenger.registerActionHandler(
          'NetworkController:getSelectedNetworkClient',
          jest.fn().mockReturnValue({
            provider: {
              request,
            },
          }),
        );

        const estimateGasParams = { to: '0x123', value: '0x0' };

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:estimateGas',
          estimateGasParams,
        );

        expect(request).toHaveBeenCalledWith({
          method: 'eth_estimateGas',
          params: [estimateGasParams],
        });
        expect(result).toStrictEqual((21000).toString(16));
      });
    });

    it('throws if there is no selected network client', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'NetworkController:getSelectedNetworkClient',
          jest.fn().mockReturnValue(undefined),
        );

        await expect(
          rootMessenger.call('LegacyBackgroundApiService:estimateGas', {
            to: '0x123',
          }),
        ).rejects.toThrow('No network client available for gas estimation');
      });
    });
  });

  describe('decodeTransactionData', () => {
    it('decodes transaction data using the selected network client provider', async () => {
      await withService(async ({ rootMessenger }) => {
        const provider = { request: jest.fn() };
        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({
            selectedNetworkClientId: 'networkClientId',
          }),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({ provider }),
        );

        const decoded = {
          data: [],
          source: DecodedTransactionDataSource.FourByte,
        };
        jest.mocked(decodeTransactionData).mockResolvedValue(decoded);

        const request = {
          transactionData: '0xabc',
          contractAddress: '0x123',
          chainId: '0x1',
        } as const;

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:decodeTransactionData',
          request,
        );

        expect(decodeTransactionData).toHaveBeenCalledWith({
          ...request,
          provider,
        });
        expect(result).toStrictEqual(decoded);
      });
    });
  });

  describe('getSeedPhrase', () => {
    it('returns the seed phrase', async () => {
      const mnemonic =
        'test test test test test test test test test test test ball';

      const mockSeedPhrase = new Uint8Array(
        new Uint16Array(
          mnemonic.split(' ').map((word) => wordlist.indexOf(word)),
        ).buffer,
      );

      const encodedSeedPhrase = Buffer.from(mnemonic, 'utf8');

      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:exportSeedPhrase',
          jest.fn().mockReturnValue(mockSeedPhrase),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getSeedPhrase',
          'password',
        );

        expect(result).toEqual(encodedSeedPhrase);
      });
    });
  });

  describe('addTransaction', () => {
    const TRANSACTION_PARAMS = {
      from: '0xfromaddress',
      to: '0xtoaddress',
    } as unknown as Parameters<LegacyBackgroundApiService['addTransaction']>[0];
    const NETWORK_CLIENT_ID = 'networkClientId';

    /**
     * Registers the handlers required by the transaction-add pipeline to add an
     * EOA transaction with security alerts disabled.
     *
     * @param rootMessenger - The root messenger to register handlers on.
     * @param transactions - The transactions to expose via
     * `TransactionController:getState`.
     */
    function registerAddTransactionHandlers(
      rootMessenger: RootMessenger,
      transactions: TransactionMeta[] = [],
    ): void {
      rootMessenger.registerActionHandler(
        'AccountsController:listAccounts',
        jest.fn().mockReturnValue([]),
      );
      rootMessenger.registerActionHandler(
        'AccountsController:getAccountByAddress',
        jest
          .fn()
          .mockReturnValue(
            createMockInternalAccount({ address: '0xfromaddress' }),
          ),
      );
      rootMessenger.registerActionHandler(
        'NetworkController:getNetworkConfigurationByNetworkClientId',
        jest.fn().mockReturnValue({ chainId: '0x1' }),
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:getState',
        jest.fn().mockReturnValue({ securityAlertsEnabled: false }),
      );
      rootMessenger.registerActionHandler(
        'TransactionController:getState',
        jest.fn().mockReturnValue({ transactions }),
      );
    }

    it('adds the transaction via the TransactionController and returns its metadata without waiting for publish', async () => {
      await withService(async ({ rootMessenger }) => {
        const transactionMeta = {
          id: 'txId',
          hash: '0xhash',
        } as TransactionMeta;
        registerAddTransactionHandlers(rootMessenger);
        const addTransactionHandler = jest.fn().mockResolvedValue({
          result: Promise.resolve('0xhash'),
          transactionMeta,
        });
        rootMessenger.registerActionHandler(
          'TransactionController:addTransaction',
          addTransactionHandler,
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:addTransaction',
          TRANSACTION_PARAMS,
          { networkClientId: NETWORK_CLIENT_ID },
        );

        expect(addTransactionHandler).toHaveBeenCalledWith(TRANSACTION_PARAMS, {
          networkClientId: NETWORK_CLIENT_ID,
          isInternal: true,
        });
        expect(result).toStrictEqual(transactionMeta);
      });
    });
  });

  describe('addTransactionAndWaitForPublish', () => {
    const TRANSACTION_PARAMS = {
      from: '0xfromaddress',
      to: '0xtoaddress',
    } as unknown as Parameters<
      LegacyBackgroundApiService['addTransactionAndWaitForPublish']
    >[0];
    const NETWORK_CLIENT_ID = 'networkClientId';

    it('waits for the transaction to publish and returns the final metadata', async () => {
      await withService(async ({ rootMessenger }) => {
        const finalTransactionMeta = {
          id: 'txId',
          hash: '0xhash',
        } as TransactionMeta;

        rootMessenger.registerActionHandler(
          'AccountsController:listAccounts',
          jest.fn().mockReturnValue([]),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest
            .fn()
            .mockReturnValue(
              createMockInternalAccount({ address: '0xfromaddress' }),
            ),
        );
        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkConfigurationByNetworkClientId',
          jest.fn().mockReturnValue({ chainId: '0x1' }),
        );
        rootMessenger.registerActionHandler(
          'PreferencesController:getState',
          jest.fn().mockReturnValue({ securityAlertsEnabled: false }),
        );
        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({ transactions: [finalTransactionMeta] }),
        );
        rootMessenger.registerActionHandler(
          'TransactionController:addTransaction',
          jest.fn().mockResolvedValue({
            result: Promise.resolve('0xhash'),
            transactionMeta: { id: 'txId' } as TransactionMeta,
          }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:addTransactionAndWaitForPublish',
          TRANSACTION_PARAMS,
          { networkClientId: NETWORK_CLIENT_ID },
        );

        expect(result).toStrictEqual(finalTransactionMeta);
      });
    });
  });

  describe('resetAccount', () => {
    it('resets the account and returns the selected address', async () => {
      const selectedAddress = '0x123';

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({
            selectedNetworkClientId: 'baz',
          }),
        );

        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({
            configuration: { chainId: '0x1' },
          }),
        );

        rootMessenger.registerActionHandler(
          'AccountsController:getSelectedAccount',
          jest.fn().mockReturnValue({ address: selectedAddress }),
        );

        rootMessenger.registerActionHandler(
          'TransactionController:wipeTransactions',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'SmartTransactionsController:wipeSmartTransactions',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'BridgeStatusController:wipeBridgeStatus',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'NetworkController:resetConnection',
          jest.fn(),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:resetAccount',
        );

        expect(result).toStrictEqual(selectedAddress);

        expect(callSpy).toHaveBeenCalledWith(
          'TransactionController:wipeTransactions',
          {
            address: selectedAddress,
            chainId: '0x1',
          },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'SmartTransactionsController:wipeSmartTransactions',
          {
            address: selectedAddress,
            ignoreNetwork: false,
          },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'BridgeStatusController:wipeBridgeStatus',
          {
            address: selectedAddress,
            ignoreNetwork: false,
          },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'NetworkController:resetConnection',
        );
      });
    });
  });

  describe('getGlobalChainId', () => {
    it('returns the global chain ID', async () => {
      const globalChainId = '0x1';

      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({
            selectedNetworkClientId: 'baz',
          }),
        );

        rootMessenger.registerActionHandler(
          'NetworkController:getNetworkClientById',
          jest.fn().mockReturnValue({
            configuration: { chainId: globalChainId },
          }),
        );

        const result = rootMessenger.call(
          'LegacyBackgroundApiService:getGlobalChainId',
        );

        expect(result).toStrictEqual(globalChainId);
      });
    });
  });

  describe('lookupSelectedNetworks', () => {
    it('looks up the selected network and each enabled network client', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');
        const lookupNetwork = jest.fn().mockResolvedValue(undefined);

        rootMessenger.registerActionHandler(
          'NetworkEnablementController:getState',
          jest.fn().mockReturnValue({
            enabledNetworkMap: {
              eip155: {
                '0x1': true,
                '0xe708': false,
              },
            },
          }),
        );

        rootMessenger.registerActionHandler(
          'NetworkController:getState',
          jest.fn().mockReturnValue({
            networkConfigurationsByChainId: {
              '0x1': {
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'mainnet' }],
              },
              '0xe708': {
                defaultRpcEndpointIndex: 0,
                rpcEndpoints: [{ networkClientId: 'linea-mainnet' }],
              },
            },
          }),
        );

        rootMessenger.registerActionHandler(
          'NetworkController:lookupNetwork',
          lookupNetwork,
        );

        await rootMessenger.call(
          'LegacyBackgroundApiService:lookupSelectedNetworks',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'NetworkEnablementController:getState',
        );
        expect(callSpy).toHaveBeenCalledWith('NetworkController:getState');
        expect(lookupNetwork).toHaveBeenCalledWith();
        expect(lookupNetwork).toHaveBeenCalledWith('mainnet');
        expect(lookupNetwork).not.toHaveBeenCalledWith('linea-mainnet');
      });
    });
  });

  describe('setEnabledNetworks', () => {
    it('enables the network then looks up selected networks via sibling call', async () => {
      await withService(
        async ({ rootMessenger, service, serviceMessenger }) => {
          const enableNetwork = jest.fn();
          const callSpy = jest.spyOn(serviceMessenger, 'call');
          const lookupSpy = jest
            .spyOn(service, 'lookupSelectedNetworks')
            .mockResolvedValue(undefined);

          rootMessenger.registerActionHandler(
            'NetworkEnablementController:enableNetwork',
            enableNetwork,
          );

          await rootMessenger.call(
            'LegacyBackgroundApiService:setEnabledNetworks',
            '0x1',
          );

          expect(enableNetwork).toHaveBeenCalledWith('0x1');
          expect(lookupSpy).toHaveBeenCalledTimes(1);
          expect(callSpy).not.toHaveBeenCalledWith(
            'LegacyBackgroundApiService:lookupSelectedNetworks',
          );
        },
      );
    });

    it('logs and rethrows when enabling the network fails', async () => {
      await withService(async ({ rootMessenger, service }) => {
        const error = new Error('enable failed');
        const lookupSpy = jest.spyOn(service, 'lookupSelectedNetworks');

        rootMessenger.registerActionHandler(
          'NetworkEnablementController:enableNetwork',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:setEnabledNetworks',
            '0x1',
          ),
        ).rejects.toThrow(error);

        expect(lookupSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('setEnabledAllPopularNetworks', () => {
    it('enables all popular networks then looks up selected networks via sibling call', async () => {
      await withService(
        async ({ rootMessenger, service, serviceMessenger }) => {
          const enableAllPopularNetworks = jest.fn();
          const callSpy = jest.spyOn(serviceMessenger, 'call');
          const lookupSpy = jest
            .spyOn(service, 'lookupSelectedNetworks')
            .mockResolvedValue(undefined);

          rootMessenger.registerActionHandler(
            'NetworkEnablementController:enableAllPopularNetworks',
            enableAllPopularNetworks,
          );

          await rootMessenger.call(
            'LegacyBackgroundApiService:setEnabledAllPopularNetworks',
          );

          expect(enableAllPopularNetworks).toHaveBeenCalledTimes(1);
          expect(lookupSpy).toHaveBeenCalledTimes(1);
          expect(callSpy).not.toHaveBeenCalledWith(
            'LegacyBackgroundApiService:lookupSelectedNetworks',
          );
        },
      );
    });

    it('logs and rethrows when enabling all popular networks fails', async () => {
      await withService(async ({ rootMessenger, service }) => {
        const error = new Error('enable all failed');
        const lookupSpy = jest.spyOn(service, 'lookupSelectedNetworks');

        rootMessenger.registerActionHandler(
          'NetworkEnablementController:enableAllPopularNetworks',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:setEnabledAllPopularNetworks',
          ),
        ).rejects.toThrow(error);

        expect(lookupSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('removeAccount', () => {
    it('removes an account', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:removeAccount',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'PermissionController:updatePermissionsByCaveat',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:removeAccount',
          '0x123',
        );

        expect(result).toStrictEqual('0x123');

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:removeAccount',
          '0x123',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'PermissionController:updatePermissionsByCaveat',
          Caip25CaveatType,
          expect.any(Function),
        );
      });
    });
  });

  describe('onAccountRemoved', () => {
    it('executes side effects of a removed account', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'PermissionController:updatePermissionsByCaveat',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:onAccountRemoved',
          '0x123',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'PermissionController:updatePermissionsByCaveat',
          Caip25CaveatType,
          expect.any(Function),
        );
      });
    });
  });

  describe('rejectPermissionsRequest', () => {
    it('rejects the pending permissions request', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'PermissionController:rejectPermissionsRequest',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectPermissionsRequest',
          'DUMMY_ID',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'PermissionController:rejectPermissionsRequest',
          'DUMMY_ID',
        );
      });
    });

    it('does not propagate PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'PermissionController:rejectPermissionsRequest',
          jest.fn().mockImplementation(() => {
            throw new PermissionsRequestNotFoundError('123');
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:rejectPermissionsRequest',
            'DUMMY_ID',
          ),
        ).not.toThrow();
      });
    });

    it('propagates errors other than PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('Some other error');
        rootMessenger.registerActionHandler(
          'PermissionController:rejectPermissionsRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:rejectPermissionsRequest',
            'DUMMY_ID',
          ),
        ).toThrow(error);
      });
    });
  });

  describe('removePermissionsFor', () => {
    const subjects = { 'test.com': ['eth_accounts'] as [string] };

    it('revokes the given permissions for the given subjects', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const revokePermissions = jest.fn();
        rootMessenger.registerActionHandler(
          'PermissionController:revokePermissions',
          revokePermissions,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:removePermissionsFor',
          subjects,
        );

        expect(callSpy).toHaveBeenCalledWith(
          'PermissionController:revokePermissions',
          subjects,
        );
        expect(revokePermissions).toHaveBeenCalledWith(subjects);
      });
    });

    it('does not propagate a PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'PermissionController:revokePermissions',
          jest.fn(() => {
            throw new PermissionsRequestNotFoundError('123');
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:removePermissionsFor',
            subjects,
          ),
        ).not.toThrow();
      });
    });

    it('propagates an error other than PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('some other error');
        rootMessenger.registerActionHandler(
          'PermissionController:revokePermissions',
          jest.fn(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:removePermissionsFor',
            subjects,
          ),
        ).toThrow(error);
      });
    });
  });

  describe('importAccountWithStrategy', () => {
    it('imports an account without social login', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'foo' }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:importAccountWithStrategy',
          AccountImportStrategy.privateKey,
          ['foo', 'bar', 'baz'],
        );

        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:getAccountByAddress',
          '0x123',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:setSelectedAccount',
          'foo',
        );
      });
    });

    it('imports an account with social login', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'foo' }),
        );

        rootMessenger.registerActionHandler(
          'KeyringController:withKeyringV2',
          jest.fn().mockImplementation(({ address }, callback) => {
            expect(address).toBe('0x123');
            return callback({
              keyring: {
                exportAccount: jest.fn().mockResolvedValue({
                  privateKey:
                    '0000000000000000000000000000000000000000000000000000000000000001',
                }),
              },
              metadata: {
                id: 'foo',
              },
            });
          }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:addNewSecretData',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const runMigrationsHandler = jest.fn().mockResolvedValue(false);
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:runMigrations',
          runMigrationsHandler,
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:getState',
          jest.fn().mockReturnValue({ migrationVersion: 0 }),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:withKeyringV2',
          { address: '0x123' },
          expect.any(Function),
        );

        // Migrations run before adding the new secret data.
        expect(runMigrationsHandler).toHaveBeenCalledTimes(1);

        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:addNewSecretData',
          hexToBytes(
            add0x(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
          ),
          EncAccountDataType.ImportedPrivateKey,
          { keyringId: 'foo' },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:importAccountWithStrategy',
          AccountImportStrategy.privateKey,
          ['foo', 'bar', 'baz'],
        );

        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:getAccountByAddress',
          '0x123',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:setSelectedAccount',
          'foo',
        );
      });
    });

    it('throws an error if the imported account is not found', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue(null),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
          ),
        ).rejects.toThrow('No account found for address: 0x123');
      });
    });

    it('throws an error if it fails to add new secret data for a social login account', async () => {
      const mockError = new Error('Failed to add new secret data');

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'foo' }),
        );

        rootMessenger.registerActionHandler(
          'KeyringController:withKeyringV2',
          jest.fn().mockImplementation(({ address }, callback) => {
            expect(address).toBe('0x123');
            return callback({
              keyring: {
                exportAccount: jest.fn().mockResolvedValue({
                  privateKey:
                    '0000000000000000000000000000000000000000000000000000000000000001',
                }),
              },
              metadata: {
                id: 'foo',
              },
            });
          }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:addNewSecretData',
          jest.fn().mockRejectedValue(mockError),
        );

        rootMessenger.registerActionHandler(
          'KeyringController:removeAccount',
          jest.fn(),
        );

        // Onboarding is not yet complete, so migrations are skipped.
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: false }),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
          ),
        ).rejects.toThrow(mockError);

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:removeAccount',
          '0x123',
        );
      });
    });

    it('does not sync with server if shouldCreateSocialBackup is false', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'foo' }),
        );

        rootMessenger.registerActionHandler(
          'KeyringController:withKeyringV2',
          jest.fn().mockImplementation(({ address }, callback) => {
            expect(address).toBe('0x123');
            return callback({
              keyring: {
                exportAccount: jest.fn().mockResolvedValue({
                  privateKey:
                    '0000000000000000000000000000000000000000000000000000000000000001',
                }),
              },
              metadata: {
                id: 'foo',
              },
            });
          }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:updateBackupMetadataState',
          jest.fn(),
        );

        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
            { shouldCreateSocialBackup: false, shouldSelectAccount: true },
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:updateBackupMetadataState',
          {
            keyringId: 'foo',
            data: hexToBytes(
              add0x(
                '0000000000000000000000000000000000000000000000000000000000000001',
              ),
            ),
            type: SecretType.PrivateKey,
          },
        );

        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:addNewSecretData',
          hexToBytes(
            add0x(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
          ),
          SecretType.PrivateKey,
          { keyringId: 'foo' },
        );
      });
    });

    it('does not select the account if shouldSelectAccount is false', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:importAccountWithStrategy',
          jest.fn().mockResolvedValue('0x123'),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'foo' }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:importAccountWithStrategy',
            AccountImportStrategy.privateKey,
            ['foo', 'bar', 'baz'],
            { shouldCreateSocialBackup: true, shouldSelectAccount: false },
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:importAccountWithStrategy',
          AccountImportStrategy.privateKey,
          ['foo', 'bar', 'baz'],
        );

        expect(callSpy).not.toHaveBeenCalledWith(
          'AccountsController:getAccountByAddress',
          '0x123',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'AccountsController:setSelectedAccount',
          'foo',
        );
      });
    });
  });

  describe('getAccountsBySnapId', () => {
    it('returns the address from the snap keyring', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:withKeyringV2',
          jest.fn().mockResolvedValue(['0x123']),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getAccountsBySnapId',
          'snapId' as SnapId,
        );

        expect(result).toStrictEqual(['0x123']);
      });
    });
  });

  describe('isSendBundleSupported', () => {
    it('returns whether the sendBundle feature is supported for the chain', async () => {
      jest.mocked(isSendBundleSupported).mockResolvedValue(true);

      await withService(async ({ rootMessenger }) => {
        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:isSendBundleSupported',
          '0x1',
        );

        expect(isSendBundleSupported).toHaveBeenCalledWith('0x1');
        expect(result).toBe(true);
      });
    });
  });

  describe('setAccountLabel', () => {
    it('sets the account name for the account at the given address', async () => {
      await withService(async ({ rootMessenger }) => {
        const setAccountNameHandler = jest.fn();
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue({ id: 'account-id' }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:setAccountName',
          setAccountNameHandler,
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:setAccountLabel',
          '0x123',
          'New Label',
        );

        expect(setAccountNameHandler).toHaveBeenCalledWith(
          'account-id',
          'New Label',
        );
      });
    });

    it('throws if no account is found for the given address', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'AccountsController:getAccountByAddress',
          jest.fn().mockReturnValue(undefined),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:setAccountLabel',
            '0x123',
            'New Label',
          ),
        ).toThrow('No account found for address: 0x123');
      });
    });
  });

  describe('exportAccount', () => {
    it('verifies the password and returns the private key', async () => {
      const address = '0xAddress';
      const password = 'a-test-password';
      const privateKey = 'a-test-private-key';

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const verifyPasswordHandler = jest.fn().mockResolvedValue(undefined);
        const exportAccountHandler = jest.fn().mockResolvedValue(privateKey);

        rootMessenger.registerActionHandler(
          'KeyringController:verifyPassword',
          verifyPasswordHandler,
        );
        rootMessenger.registerActionHandler(
          'KeyringController:exportAccount',
          exportAccountHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:exportAccount',
          address,
          password,
        );

        expect(result).toStrictEqual(privateKey);
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:verifyPassword',
          password,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:exportAccount',
          { password },
          address,
        );
      });
    });

    it('rejects and does not export the account when the password is invalid', async () => {
      const address = '0xAddress';
      const password = 'wrong-password';
      const error = new Error('Incorrect password.');

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const verifyPasswordHandler = jest.fn().mockRejectedValue(error);
        const exportAccountHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'KeyringController:verifyPassword',
          verifyPasswordHandler,
        );
        rootMessenger.registerActionHandler(
          'KeyringController:exportAccount',
          exportAccountHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:exportAccount',
            address,
            password,
          ),
        ).rejects.toThrow(error);

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:verifyPassword',
          password,
        );
        expect(exportAccountHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('upsertTransactionUIMetricsFragment', () => {
    it('does nothing if the transaction id is missing', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:upsertTransactionUIMetricsFragment',
          '',
          {
            properties: { foo: 'bar' },
          },
        );

        expect(callSpy).not.toHaveBeenCalled();
      });
    });

    it('does nothing if the payload is missing', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:upsertTransactionUIMetricsFragment',
          'transaction-id',
          undefined as never,
        );

        expect(callSpy).not.toHaveBeenCalled();
      });
    });

    it('updates the fragment if it already exists', async () => {
      const transactionId = 'transaction-id';
      const fragmentId = `transaction-ui-${transactionId}`;
      const payload = { properties: { foo: 'bar' } };

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const getEventFragmentByIdHandler = jest
          .fn()
          .mockReturnValue({ id: fragmentId });
        const updateEventFragmentHandler = jest.fn();
        const createEventFragmentHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'MetaMetricsController:getEventFragmentById',
          getEventFragmentByIdHandler,
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:updateEventFragment',
          updateEventFragmentHandler,
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:createEventFragment',
          createEventFragmentHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:upsertTransactionUIMetricsFragment',
          transactionId,
          payload,
        );

        expect(getEventFragmentByIdHandler).toHaveBeenCalledWith(fragmentId);
        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:updateEventFragment',
          fragmentId,
          payload,
        );
        expect(createEventFragmentHandler).not.toHaveBeenCalled();
      });
    });

    it('creates the fragment if it does not exist', async () => {
      const transactionId = 'transaction-id';
      const fragmentId = `transaction-ui-${transactionId}`;
      const payload = {
        properties: { foo: 'bar' },
        sensitiveProperties: { secret: 'baz' },
      };

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const getEventFragmentByIdHandler = jest
          .fn()
          .mockReturnValue(undefined);
        const updateEventFragmentHandler = jest.fn();
        const createEventFragmentHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'MetaMetricsController:getEventFragmentById',
          getEventFragmentByIdHandler,
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:updateEventFragment',
          updateEventFragmentHandler,
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:createEventFragment',
          createEventFragmentHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:upsertTransactionUIMetricsFragment',
          transactionId,
          payload,
        );

        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:createEventFragment',
          {
            uniqueIdentifier: fragmentId,
            successEvent: 'Transaction Fragment Created',
            category: MetaMetricsEventCategory.Transactions,
            canDeleteIfAbandoned: true,
            properties: payload.properties,
            sensitiveProperties: payload.sensitiveProperties,
          },
        );
        expect(updateEventFragmentHandler).not.toHaveBeenCalled();
      });
    });

    it('defaults properties and sensitiveProperties to empty objects when creating', async () => {
      const transactionId = 'transaction-id';
      const fragmentId = `transaction-ui-${transactionId}`;

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'MetaMetricsController:getEventFragmentById',
          jest.fn().mockReturnValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:createEventFragment',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:upsertTransactionUIMetricsFragment',
          transactionId,
          { category: MetaMetricsEventCategory.Transactions },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:createEventFragment',
          expect.objectContaining({
            uniqueIdentifier: fragmentId,
            properties: {},
            sensitiveProperties: {},
          }),
        );
      });
    });
  });

  describe('setSelectedInternalAccount', () => {
    it('sets the selected account when the account exists', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'AccountsController:getAccount',
          jest.fn().mockReturnValue({ id: 'mock-id' }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:setSelectedInternalAccount',
          'mock-id',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:getAccount',
          'mock-id',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:setSelectedAccount',
          'mock-id',
        );
      });
    });

    it('does not set the selected account when the account does not exist', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'AccountsController:getAccount',
          jest.fn().mockReturnValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:setSelectedAccount',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.call(
          'LegacyBackgroundApiService:setSelectedInternalAccount',
          'mock-id',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:getAccount',
          'mock-id',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'AccountsController:setSelectedAccount',
          'mock-id',
        );
      });
    });
  });

  describe('checkIsSeedlessPasswordOutdated', () => {
    it("returns false if it's a social login flow", async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: false }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
        );

        expect(result).toStrictEqual(false);
      });
    });

    it('returns false if the user has not completed onboarding', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: false }),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
        );

        expect(result).toStrictEqual(false);
      });
    });

    it('returns true if the password is outdated', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(true),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
        );

        expect(result).toStrictEqual(true);
      });
    });

    it('returns false if the password is not outdated', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(false),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
        );

        expect(result).toStrictEqual(false);
      });
    });

    it('skips the cache if specified', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(false),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
          { skipCache: true },
        );

        expect(result).toStrictEqual(false);

        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          { skipCache: true },
        );
      });
    });

    it('captures and throws an error', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const error = new Error('Test error');

        const captureExceptionSpy = jest.spyOn(
          serviceMessenger,
          'captureException',
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );

        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockRejectedValue(error),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated',
            {
              captureSentryError: true,
            },
          ),
        ).rejects.toThrow(error);

        expect(captureExceptionSpy).toHaveBeenCalledWith(
          createSentryError(
            'Failed to check if seedless password is outdated',
            error,
          ),
        );
      });
    });
  });

  describe('submitPasswordOrEncryptionKey', () => {
    it('submits the encryption key to the keyring controller', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:submitPasswordOrEncryptionKey',
            {
              encryptionKey: 'encryption-key',
            },
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitEncryptionKey',
          'encryption-key',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'KeyringController:submitPassword',
          expect.anything(),
        );
        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:updateAccounts',
        );
        expect(callSpy).toHaveBeenCalledWith('MultichainAccountService:init');
        expect(callSpy).toHaveBeenCalledWith('AccountTreeController:init');
      });
    });

    it('submits the password to the keyring controller', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:submitPasswordOrEncryptionKey',
            {
              password: 'password',
            },
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitPassword',
          'password',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'KeyringController:submitEncryptionKey',
          expect.anything(),
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:submitPassword',
          expect.anything(),
        );
      });
    });

    it('also unlocks the seedless onboarding vault during a social login flow', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:submitPasswordOrEncryptionKey',
            {
              password: 'password',
            },
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitPassword',
          'password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:submitPassword',
          'password',
        );
      });
    });
  });

  describe('unlockWithPasskey', () => {
    const authenticationResponse =
      'authentication-response' as unknown as Parameters<
        LegacyBackgroundApiService['unlockWithPasskey']
      >[0];

    it('unlocks via the passkey controller and runs post-unlock account init', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const unlockSpy = jest.fn().mockResolvedValue(undefined);
        rootMessenger.registerActionHandler(
          'PasskeyController:unlockWithPasskey',
          unlockSpy,
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:unlockWithPasskey',
            authenticationResponse,
          ),
        ).resolves.toBeUndefined();

        expect(unlockSpy).toHaveBeenCalledWith(authenticationResponse);
        expect(callSpy).toHaveBeenCalledWith(
          'AccountsController:updateAccounts',
        );
        expect(callSpy).toHaveBeenCalledWith('MultichainAccountService:init');
        expect(callSpy).toHaveBeenCalledWith('AccountTreeController:init');
      });
    });

    it('propagates errors from the passkey controller and skips account init', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const error = new Error('not enrolled');
        rootMessenger.registerActionHandler(
          'PasskeyController:unlockWithPasskey',
          jest.fn().mockRejectedValue(error),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:unlockWithPasskey',
            authenticationResponse,
          ),
        ).rejects.toThrow(error);

        expect(callSpy).not.toHaveBeenCalledWith(
          'AccountsController:updateAccounts',
        );
      });
    });
  });

  describe('changePasswordWithPasskeyVerification', () => {
    const params = {
      newPassword: 'new-password',
      authenticationResponse: 'authentication-response',
      options: { renewVaultKeyProtection: true },
    } as unknown as Parameters<
      LegacyBackgroundApiService['changePasswordWithPasskeyVerification']
    >[0];

    it('delegates to the passkey controller with the params', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const changePasswordHandler = jest.fn().mockResolvedValue(undefined);
        rootMessenger.registerActionHandler(
          'PasskeyController:changePasswordWithPasskeyVerification',
          changePasswordHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
            params,
          ),
        ).resolves.toBeUndefined();

        expect(changePasswordHandler).toHaveBeenCalledWith(params);
        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:changePasswordWithPasskeyVerification',
          params,
        );
      });
    });

    it('serializes the change through the shared seedless operation mutex', async () => {
      const seedlessOperationMutex = new Mutex();
      const runExclusiveSpy = jest.spyOn(
        seedlessOperationMutex,
        'runExclusive',
      );

      await withService(
        { options: { seedlessOperationMutex } },
        async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'PasskeyController:changePasswordWithPasskeyVerification',
            jest.fn().mockResolvedValue(undefined),
          );

          await rootMessenger.call(
            'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
            params,
          );

          expect(runExclusiveSpy).toHaveBeenCalledTimes(1);
          // The lock is released once the delegated call resolves.
          expect(seedlessOperationMutex.isLocked()).toBe(false);
        },
      );
    });

    it('releases the mutex even when the passkey controller throws', async () => {
      const seedlessOperationMutex = new Mutex();
      const error = new Error('verification failed');

      await withService(
        { options: { seedlessOperationMutex } },
        async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'PasskeyController:changePasswordWithPasskeyVerification',
            jest.fn().mockRejectedValue(error),
          );

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
              params,
            ),
          ).rejects.toThrow(error);

          expect(seedlessOperationMutex.isLocked()).toBe(false);
        },
      );
    });
  });

  describe('changePassword', () => {
    it('changes the keyring password and releases the lock for a non-social login flow', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        const changePasswordHandler = jest.fn().mockResolvedValue(undefined);
        rootMessenger.registerActionHandler(
          'KeyringController:changePassword',
          changePasswordHandler,
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:changePassword',
            'new-password',
            'old-password',
          ),
        ).resolves.toBeUndefined();

        expect(changePasswordHandler).toHaveBeenCalledTimes(1);
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:changePassword',
          'new-password',
        );
        // No seedless onboarding controller calls for a non-social login flow.
        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:changePassword',
          expect.anything(),
          expect.anything(),
        );
      });
    });

    it('releases the seedless operation mutex after a successful change', async () => {
      const releaseLock = jest.fn();
      const seedlessOperationMutex = new Mutex();
      jest
        .spyOn(seedlessOperationMutex, 'acquire')
        .mockResolvedValue(releaseLock);

      await withService(
        { options: { seedlessOperationMutex } },
        async ({ rootMessenger }) => {
          rootMessenger.registerActionHandler(
            'OnboardingController:getIsSocialLoginFlow',
            jest.fn().mockReturnValue(false),
          );
          rootMessenger.registerActionHandler(
            'KeyringController:changePassword',
            jest.fn().mockResolvedValue(undefined),
          );

          await rootMessenger.call(
            'LegacyBackgroundApiService:changePassword',
            'new-password',
            'old-password',
          );

          expect(seedlessOperationMutex.acquire).toHaveBeenCalledTimes(1);
          expect(releaseLock).toHaveBeenCalledTimes(1);
        },
      );
    });

    it('also changes the seedless onboarding password and stores the new keyring encryption key for a social login flow', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:changePassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:changePassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:exportEncryptionKey',
          jest.fn().mockResolvedValue('new-encryption-key'),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:changePassword',
            'new-password',
            'old-password',
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:changePassword',
          'new-password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:changePassword',
          'new-password',
          'old-password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:exportEncryptionKey',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          'new-encryption-key',
        );
      });
    });

    it('reverts the keyring password change and captures the error when the seedless onboarding password change fails', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const error = new Error('seedless change failed');

        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        const changePasswordHandler = jest.fn().mockResolvedValue(undefined);
        rootMessenger.registerActionHandler(
          'KeyringController:changePassword',
          changePasswordHandler,
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:changePassword',
          jest.fn().mockRejectedValue(error),
        );
        const exportEncryptionKeyHandler = jest
          .fn()
          .mockResolvedValue('reverted-encryption-key');
        rootMessenger.registerActionHandler(
          'KeyringController:exportEncryptionKey',
          exportEncryptionKeyHandler,
        );
        const storeKeyringEncryptionKeyHandler = jest
          .fn()
          .mockResolvedValue(undefined);
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          storeKeyringEncryptionKeyHandler,
        );

        const captureExceptionSpy = jest.spyOn(
          serviceMessenger,
          'captureException',
        );
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:changePassword',
            'new-password',
            'old-password',
          ),
        ).rejects.toThrow(error);

        // The keyring password is first changed to the new password, then
        // reverted to the old password.
        expect(changePasswordHandler).toHaveBeenNthCalledWith(
          1,
          'new-password',
        );
        expect(changePasswordHandler).toHaveBeenNthCalledWith(
          2,
          'old-password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          'reverted-encryption-key',
        );
        expect(captureExceptionSpy).toHaveBeenCalledWith(
          createSentryError(
            'error while changing password for social login flow',
            error,
          ),
        );
      });
    });

    it('releases the lock and rethrows when the keyring password change fails', async () => {
      const releaseLock = jest.fn();
      const seedlessOperationMutex = new Mutex();
      jest
        .spyOn(seedlessOperationMutex, 'acquire')
        .mockResolvedValue(releaseLock);

      await withService(
        { options: { seedlessOperationMutex } },
        async ({ rootMessenger }) => {
          const error = new Error('keyring change failed');

          rootMessenger.registerActionHandler(
            'OnboardingController:getIsSocialLoginFlow',
            jest.fn().mockReturnValue(false),
          );
          rootMessenger.registerActionHandler(
            'KeyringController:changePassword',
            jest.fn().mockRejectedValue(error),
          );

          await expect(
            rootMessenger.call(
              'LegacyBackgroundApiService:changePassword',
              'new-password',
              'old-password',
            ),
          ).rejects.toThrow(error);

          expect(releaseLock).toHaveBeenCalledTimes(1);
        },
      );
    });
  });

  describe('setLocked', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('locks the keyring and clears the session state', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SubscriptionController:stopAllPolling',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'AuthenticationController:getState',
          jest.fn().mockReturnValue({ isSignedIn: false }),
        );
        rootMessenger.registerActionHandler(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call('LegacyBackgroundApiService:setLocked'),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith('KeyringController:setLocked');
        expect(callSpy).toHaveBeenCalledWith(
          'SubscriptionController:stopAllPolling',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          true,
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:setLocked',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'AuthenticationController:performSignOut',
        );

        // After the suppression window elapses, the flag is reset.
        jest.advanceTimersByTime(PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS);

        expect(callSpy).toHaveBeenCalledWith(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          false,
        );
      });
    });

    it('signs the user out when they are signed in', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SubscriptionController:stopAllPolling',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'AuthenticationController:getState',
          jest.fn().mockReturnValue({ isSignedIn: true }),
        );
        rootMessenger.registerActionHandler(
          'AuthenticationController:performSignOut',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await rootMessenger.call('LegacyBackgroundApiService:setLocked');

        expect(callSpy).toHaveBeenCalledWith(
          'AuthenticationController:performSignOut',
        );
      });
    });

    it('locks the seedless onboarding controller during a social login flow', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SubscriptionController:stopAllPolling',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'AuthenticationController:getState',
          jest.fn().mockReturnValue({ isSignedIn: false }),
        );
        rootMessenger.registerActionHandler(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          jest.fn(),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await rootMessenger.call('LegacyBackgroundApiService:setLocked');

        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:setLocked',
        );
        expect(callSpy).toHaveBeenCalledWith('KeyringController:setLocked');
      });
    });

    it('throws when locking the keyring fails', async () => {
      const error = new Error('Failed to lock');

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:setLocked',
          jest.fn().mockRejectedValue(error),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call('LegacyBackgroundApiService:setLocked'),
        ).rejects.toThrow(error);

        expect(callSpy).not.toHaveBeenCalledWith(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          true,
        );
      });
    });
  });

  describe('syncKeyringEncryptionKey', () => {
    it('stores the keyring encryption key in the seedless onboarding controller', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:exportEncryptionKey',
          jest.fn().mockResolvedValue('encryption-key'),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncKeyringEncryptionKey',
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:exportEncryptionKey',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          'encryption-key',
        );
      });
    });
  });

  describe('syncPasswordAndUnlockWallet', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('unlocks the vault with the password when it is not a social login flow', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
            'password',
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitPassword',
          'password',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'KeyringController:verifyPassword',
          expect.anything(),
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:revokePendingRefreshTokens',
        );
      });
    });

    it('unlocks and revokes pending refresh tokens for a social login flow when the password is not outdated', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(false),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:submitPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:revokePendingRefreshTokens',
          jest.fn().mockResolvedValue(undefined),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
            'password',
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitPassword',
          'password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:submitPassword',
          'password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:revokePendingRefreshTokens',
        );
        expect(callSpy).not.toHaveBeenCalledWith(
          'KeyringController:changePassword',
          expect.anything(),
        );
      });
    });

    it('syncs the global password and re-encrypts the vault when the password is outdated', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(true),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:verifyPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:submitGlobalPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:loadKeyringEncryptionKey',
          jest.fn().mockResolvedValue('keyring-encryption-key'),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:syncLatestGlobalPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedTrace',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:changePassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:exportEncryptionKey',
          jest.fn().mockResolvedValue('new-encryption-key'),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:revokePendingRefreshTokens',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedEndTrace',
          jest.fn(),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
            'global-password',
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:verifyPassword',
          'global-password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:submitGlobalPassword',
          {
            globalPassword: 'global-password',
            maxKeyChainLength: 20,
          },
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:loadKeyringEncryptionKey',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:submitEncryptionKey',
          'keyring-encryption-key',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:syncLatestGlobalPassword',
          { globalPassword: 'global-password' },
        );
        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:bufferedTrace',
          {
            name: TraceName.OnboardingResetPassword,
            op: TraceOperation.OnboardingSecurityOp,
          },
        );
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:changePassword',
          'global-password',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:exportEncryptionKey',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:storeKeyringEncryptionKey',
          'new-encryption-key',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:revokePendingRefreshTokens',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:bufferedEndTrace',
          {
            name: TraceName.OnboardingResetPassword,
            data: { success: true },
          },
        );
      });
    });

    it('locks the wallet and rethrows when re-encryption fails', async () => {
      const error = new Error('Failed to change password');

      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(true),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:verifyPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:submitGlobalPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:loadKeyringEncryptionKey',
          jest.fn().mockResolvedValue('keyring-encryption-key'),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:submitEncryptionKey',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:syncLatestGlobalPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedTrace',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:changePassword',
          jest.fn().mockRejectedValue(error),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedEndTrace',
          jest.fn(),
        );
        // Handlers used while re-locking the wallet on failure.
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:setLocked',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SubscriptionController:stopAllPolling',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'AuthenticationController:getState',
          jest.fn().mockReturnValue({ isSignedIn: false }),
        );
        rootMessenger.registerActionHandler(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          jest.fn(),
        );
        registerUnlockSideEffectHandlers(rootMessenger);

        const callSpy = jest.spyOn(serviceMessenger, 'call');
        const captureExceptionSpy = jest.spyOn(
          serviceMessenger,
          'captureException',
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
            'global-password',
          ),
        ).rejects.toThrow(error);

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:changePassword',
          'global-password',
        );
        expect(callSpy).toHaveBeenCalledWith('KeyringController:setLocked');
        expect(callSpy).toHaveBeenCalledWith(
          'MetaMetricsController:bufferedEndTrace',
          {
            name: TraceName.OnboardingResetPassword,
            data: { success: false },
          },
        );
        expect(captureExceptionSpy).toHaveBeenCalledWith(
          createSentryError(TraceName.OnboardingResetPasswordError, error),
        );
      });
    });

    it('throws an outdated password error when the keyring password is valid but the global password is reported as incorrect', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'OnboardingController:getState',
          jest.fn().mockReturnValue({ completedOnboarding: true }),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:checkIsPasswordOutdated',
          jest.fn().mockResolvedValue(true),
        );
        rootMessenger.registerActionHandler(
          'KeyringController:verifyPassword',
          jest.fn().mockResolvedValue(undefined),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:submitGlobalPassword',
          jest
            .fn()
            .mockRejectedValue(
              new RecoveryError(
                SeedlessOnboardingControllerErrorMessage.IncorrectPassword,
              ),
            ),
        );

        const callSpy = jest.spyOn(serviceMessenger, 'call');

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:syncPasswordAndUnlockWallet',
            'global-password',
          ),
        ).rejects.toThrow(
          SeedlessOnboardingControllerErrorMessage.OutdatedPassword,
        );

        expect(callSpy).not.toHaveBeenCalledWith(
          'SeedlessOnboardingController:loadKeyringEncryptionKey',
        );
        expect(callSpy).not.toHaveBeenCalledWith('KeyringController:setLocked');
      });
    });
  });

  describe('applyTransactionContainersExisting', () => {
    const TRANSACTION_ID_MOCK = '123-456';
    const ESTIMATE_GAS_MOCK = '0x456';
    const NEW_DATA_MOCK = '0x789';
    const TRANSACTION_META_MOCK = {
      id: TRANSACTION_ID_MOCK,
      txParams: {},
    } as TransactionMeta;

    it('throws if the transaction is not found', async () => {
      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({ transactions: [] }),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:applyTransactionContainersExisting',
            TRANSACTION_ID_MOCK,
            [TransactionContainerType.EnforcedSimulations],
          ),
        ).rejects.toThrow(
          `Transaction with ID ${TRANSACTION_ID_MOCK} not found.`,
        );
      });
    });

    it('calls TransactionController:updateEditableParams with the new parameters', async () => {
      await withService(async ({ rootMessenger }) => {
        jest.mocked(enforceSimulations).mockResolvedValue({
          slippage: 2.5,
          updateTransaction: (tx) => {
            tx.txParams.data = NEW_DATA_MOCK;
          },
        });

        rootMessenger.registerActionHandler(
          'MetaMetricsController:getEventFragmentById',
          jest.fn().mockReturnValue({
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              enforced_simulation_toggle_count: 2,
            },
          }),
        );
        const updateEventFragmentMock = jest.fn();
        rootMessenger.registerActionHandler(
          'MetaMetricsController:updateEventFragment',
          updateEventFragmentMock,
        );
        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({ transactions: [TRANSACTION_META_MOCK] }),
        );

        rootMessenger.registerActionHandler(
          'TransactionController:estimateGas',
          jest.fn().mockResolvedValue({ gas: ESTIMATE_GAS_MOCK }),
        );

        const updateEditableParamsMock = jest.fn();
        rootMessenger.registerActionHandler(
          'TransactionController:updateEditableParams',
          updateEditableParamsMock,
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:applyTransactionContainersExisting',
          TRANSACTION_ID_MOCK,
          [TransactionContainerType.EnforcedSimulations],
          true,
        );

        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          TRANSACTION_ID_MOCK,
          expect.objectContaining({
            containerTypes: [TransactionContainerType.EnforcedSimulations],
            data: NEW_DATA_MOCK,
            gas: ESTIMATE_GAS_MOCK,
          }),
        );
        expect(updateEventFragmentMock).toHaveBeenCalledWith(
          expect.any(String),
          {
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              enforced_simulation_toggle_count: 3,
            },
          },
        );
        expect(result).toStrictEqual({
          enforcedSimulationsSlippage: 2.5,
        });
      });
    });

    it('rejects if the transaction container update fails', async () => {
      await withService(async ({ rootMessenger }) => {
        jest.mocked(enforceSimulations).mockResolvedValue({
          slippage: 2.5,
          updateTransaction: (tx) => {
            tx.txParams.data = NEW_DATA_MOCK;
          },
        });
        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({ transactions: [TRANSACTION_META_MOCK] }),
        );
        rootMessenger.registerActionHandler(
          'TransactionController:estimateGas',
          jest.fn().mockResolvedValue({ gas: ESTIMATE_GAS_MOCK }),
        );
        rootMessenger.registerActionHandler(
          'TransactionController:updateEditableParams',
          jest.fn().mockRejectedValue(new Error('Update failed')),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:applyTransactionContainersExisting',
            TRANSACTION_ID_MOCK,
            [TransactionContainerType.EnforcedSimulations],
          ),
        ).rejects.toThrow('Update failed');
      });
    });

    it('increments the toggle count but does not persist a gas fallback when container estimation fails', async () => {
      await withService(async ({ rootMessenger }) => {
        jest.mocked(enforceSimulations).mockResolvedValue({
          slippage: 10,
          updateTransaction: (tx) => {
            tx.txParams.data = NEW_DATA_MOCK;
          },
        });

        const transactionMeta = {
          ...TRANSACTION_META_MOCK,
          txParams: { gas: '0x29b92700' },
          txParamsOriginal: { gas: '0x554af' },
        } as TransactionMeta;

        rootMessenger.registerActionHandler(
          'MetaMetricsController:getEventFragmentById',
          jest.fn().mockReturnValue({
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              enforced_simulation_toggle_count: 2,
            },
          }),
        );
        const updateEventFragmentMock = jest.fn();
        rootMessenger.registerActionHandler(
          'MetaMetricsController:updateEventFragment',
          updateEventFragmentMock,
        );
        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({ transactions: [transactionMeta] }),
        );

        rootMessenger.registerActionHandler(
          'TransactionController:estimateGas',
          jest.fn().mockResolvedValue({
            gas: '0x29b92700',
            simulationFails: {
              reason: 'Failed to simulate wrapped transaction',
              debug: { blockGasLimit: '0x77359400' },
            },
          }),
        );

        const updateEditableParamsMock = jest.fn();
        rootMessenger.registerActionHandler(
          'TransactionController:updateEditableParams',
          updateEditableParamsMock,
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:applyTransactionContainersExisting',
            TRANSACTION_ID_MOCK,
            [TransactionContainerType.EnforcedSimulations],
            true,
          ),
        ).rejects.toThrow(
          'Failed to estimate gas for transaction containers: Failed to simulate wrapped transaction',
        );

        expect(updateEventFragmentMock).toHaveBeenCalledWith(
          expect.any(String),
          {
            properties: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              enforced_simulation_toggle_count: 3,
            },
          },
        );
        expect(updateEditableParamsMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('rejectPendingApproval', () => {
    it('rejects the approval request with a JSON-RPC error', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          jest.fn(),
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectPendingApproval',
          'DUMMY_ID',
          {
            code: 1,
            message: 'DUMMY_MESSAGE',
            data: 'DUMMY_DATA',
          },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:rejectRequest',
          'DUMMY_ID',
          expect.objectContaining({
            code: 1,
            message: 'DUMMY_MESSAGE',
            data: 'DUMMY_DATA',
          }),
        );
      });
    });

    it('does not propagate ApprovalRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new ApprovalRequestNotFoundError('123');

        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:rejectPendingApproval',
            'DUMMY_ID',
            {
              code: 1,
              message: 'DUMMY_MESSAGE',
              data: 'DUMMY_DATA',
            },
          ),
        ).not.toThrow(error);
      });
    });

    it('propagates errors other than ApprovalRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('boom');

        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:rejectPendingApproval',
            'DUMMY_ID',
            {
              code: 1,
              message: 'DUMMY_MESSAGE',
              data: 'DUMMY_DATA',
            },
          ),
        ).toThrow(error);
      });
    });
  });

  describe('resolvePendingApproval', () => {
    beforeEach(() => {
      mockToHardwareWalletError.mockReset();
      mockIsUserRejectedHardwareWalletError.mockReset();
      mockIsUserRejectedHardwareWalletError.mockReturnValue(false);
    });

    it('does not propagate ApprovalRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new ApprovalRequestNotFoundError('123');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:resolvePendingApproval',
            'DUMMY_ID',
            'DUMMY_VALUE',
          ),
        ).resolves.not.toThrow(error);
      });
    });

    it('propagates errors other than ApprovalRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('boom');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:resolvePendingApproval',
            'DUMMY_ID',
            'DUMMY_VALUE',
          ),
        ).rejects.toThrow(error);
      });
    });

    it('normalizes null options before calling ApprovalController:acceptRequest', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockResolvedValue(undefined),
        );

        await rootMessenger.call(
          'LegacyBackgroundApiService:resolvePendingApproval',
          'approval-id',
          { txMeta: { id: '0x1' } },
          null,
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          'approval-id',
          { txMeta: { id: '0x1' } },
          undefined,
        );
      });
    });

    it('passes only waitForResult to ApprovalController:acceptRequest options', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockResolvedValue(undefined),
        );

        await rootMessenger.call(
          'LegacyBackgroundApiService:resolvePendingApproval',
          'approval-id',
          { txMeta: { id: '0x2' } },
          {
            waitForResult: true,
            walletType: HardwareWalletType.Ledger,
          },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          'approval-id',
          { txMeta: { id: '0x2' } },
          { waitForResult: true },
        );
      });
    });

    it('transforms hardware wallet errors to internal JSON-RPC errors', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('Ledger transport disconnected');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        mockToHardwareWalletError.mockReturnValue({
          message: 'Device disconnected',
          code: ErrorCode.DeviceDisconnected,
          severity: Severity.Err,
          category: Category.Connection,
          userMessage: 'Please reconnect your device',
          metadata: {
            transport: 'usb',
            walletType: HardwareWalletType.Ledger,
          },
        });

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:resolvePendingApproval',
            'approval-id',
            { txMeta: { id: '0x3' } },
            { walletType: HardwareWalletType.Ledger },
          ),
        ).rejects.toMatchObject({
          code: -32603,
          data: {
            code: ErrorCode.DeviceDisconnected,
            severity: Severity.Err,
            category: Category.Connection,
            userMessage: 'Please reconnect your device',
            metadata: {
              transport: 'usb',
              walletType: HardwareWalletType.Ledger,
            },
          },
        });

        expect(mockToHardwareWalletError).toHaveBeenCalledWith(
          error,
          HardwareWalletType.Ledger,
        );
      });
    });

    it('transforms user-rejected hardware wallet errors to user-rejected JSON-RPC errors', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('User rejected on device');

        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        mockToHardwareWalletError.mockReturnValue({
          message: 'User rejected',
          code: ErrorCode.UserRejected,
          severity: Severity.Info,
          category: Category.UserAction,
          userMessage: 'Request rejected',
          metadata: {
            walletType: HardwareWalletType.Ledger,
          },
        });
        mockIsUserRejectedHardwareWalletError.mockReturnValue(true);

        await expect(
          rootMessenger.call(
            'LegacyBackgroundApiService:resolvePendingApproval',
            'approval-id',
            { txMeta: { id: '0x4' } },
            { walletType: HardwareWalletType.Ledger },
          ),
        ).rejects.toMatchObject({
          code: 4001,
          data: {
            code: ErrorCode.UserRejected,
            severity: Severity.Info,
            category: Category.UserAction,
            userMessage: 'Request rejected',
            metadata: {
              walletType: HardwareWalletType.Ledger,
            },
          },
        });
      });
    });
  });

  describe('approveHardwareWalletTransaction', () => {
    it('delegates to resolvePendingApproval with transaction payload and hardware wallet options', async () => {
      await withService(async ({ service }) => {
        const resolvePendingApprovalSpy = jest
          .spyOn(service, 'resolvePendingApproval')
          .mockResolvedValue();

        const txMeta = {
          id: '42',
          txParams: {
            from: '0x0000000000000000000000000000000000000001',
            to: '0x0000000000000000000000000000000000000002',
          },
        };

        await service.approveHardwareWalletTransaction({
          txId: 42,
          txMeta,
          actionId: 'action-id',
          walletType: HardwareWalletType.Ledger,
        });

        expect(resolvePendingApprovalSpy).toHaveBeenCalledWith(
          '42',
          { txMeta, actionId: 'action-id' },
          { waitForResult: true, walletType: HardwareWalletType.Ledger },
        );
      });
    });
  });

  describe('rejectAllPendingApprovals', () => {
    it('accepts snap dialog approvals with null and deletes their interface', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');
        const acceptRequestHandler = jest.fn();
        const deleteInterfaceHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'ApprovalController:getState',
          jest.fn().mockReturnValue({
            pendingApprovals: {
              '1': {
                id: '1',
                origin: 'npm:@metamask/snap',
                type: ApprovalType.SnapDialogAlert,
                requestData: { id: 'interface-1' },
              },
              '2': {
                id: '2',
                origin: 'npm:@metamask/snap',
                type: ApprovalType.SnapDialogPrompt,
                requestData: { id: 'interface-2' },
              },
              '3': {
                id: '3',
                origin: 'npm:@metamask/snap',
                type: DIALOG_APPROVAL_TYPES.default,
                requestData: { id: 'interface-3' },
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          acceptRequestHandler,
        );
        rootMessenger.registerActionHandler(
          'SnapInterfaceController:deleteInterface',
          deleteInterfaceHandler,
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectAllPendingApprovals',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '1',
          null,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '2',
          null,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '3',
          null,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SnapInterfaceController:deleteInterface',
          'interface-1',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SnapInterfaceController:deleteInterface',
          'interface-2',
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SnapInterfaceController:deleteInterface',
          'interface-3',
        );
      });
    });

    it('accepts snap confirmation approvals with false and deletes their interface', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'ApprovalController:getState',
          jest.fn().mockReturnValue({
            pendingApprovals: {
              '1': {
                id: '1',
                origin: 'npm:@metamask/snap',
                type: ApprovalType.SnapDialogConfirmation,
                requestData: { id: 'interface-1' },
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'SnapInterfaceController:deleteInterface',
          jest.fn(),
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectAllPendingApprovals',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '1',
          false,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'SnapInterfaceController:deleteInterface',
          'interface-1',
        );
      });
    });

    it('accepts snap account confirmations with false without deleting an interface', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');
        const deleteInterfaceHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'ApprovalController:getState',
          jest.fn().mockReturnValue({
            pendingApprovals: {
              '1': {
                id: '1',
                origin: 'npm:@metamask/snap',
                type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
                requestData: {},
              },
              '2': {
                id: '2',
                origin: 'npm:@metamask/snap',
                type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
                requestData: {},
              },
              '3': {
                id: '3',
                origin: 'npm:@metamask/snap',
                type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
                requestData: {},
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'SnapInterfaceController:deleteInterface',
          deleteInterfaceHandler,
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectAllPendingApprovals',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '1',
          false,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '2',
          false,
        );
        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:acceptRequest',
          '3',
          false,
        );
        expect(deleteInterfaceHandler).not.toHaveBeenCalled();
      });
    });

    it('rejects all other approvals with a user-rejected-request error', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const callSpy = jest.spyOn(serviceMessenger, 'call');

        rootMessenger.registerActionHandler(
          'ApprovalController:getState',
          jest.fn().mockReturnValue({
            pendingApprovals: {
              '1': {
                id: '1',
                origin: 'https://example.com',
                type: ApprovalType.Transaction,
                requestData: {},
              },
            },
          }),
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          jest.fn(),
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectAllPendingApprovals',
        );

        expect(callSpy).toHaveBeenCalledWith(
          'ApprovalController:rejectRequest',
          '1',
          providerErrors.userRejectedRequest({
            data: {
              cause: 'rejectAllApprovals',
            },
          }),
        );
      });
    });

    it('does nothing when there are no pending approvals', async () => {
      await withService(async ({ rootMessenger, serviceMessenger }) => {
        const acceptRequestHandler = jest.fn();
        const rejectRequestHandler = jest.fn();

        rootMessenger.registerActionHandler(
          'ApprovalController:getState',
          jest.fn().mockReturnValue({ pendingApprovals: {} }),
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:acceptRequest',
          acceptRequestHandler,
        );
        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          rejectRequestHandler,
        );

        rootMessenger.call(
          'LegacyBackgroundApiService:rejectAllPendingApprovals',
        );

        expect(acceptRequestHandler).not.toHaveBeenCalled();
        expect(rejectRequestHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('acceptPermissionsRequest', () => {
    it('accepts the permissions request', async () => {
      await withService(async ({ rootMessenger }) => {
        const acceptPermissionsRequestHandler = jest.fn();
        rootMessenger.registerActionHandler(
          'PermissionController:acceptPermissionsRequest',
          acceptPermissionsRequestHandler,
        );

        const request = {
          metadata: { id: 'DUMMY_ID', origin: 'https://example.com' },
          permissions: {},
        };

        rootMessenger.call(
          'LegacyBackgroundApiService:acceptPermissionsRequest',
          request,
        );

        expect(acceptPermissionsRequestHandler).toHaveBeenCalledWith(request);
      });
    });

    it('does not propagate PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new PermissionsRequestNotFoundError('123');
        rootMessenger.registerActionHandler(
          'PermissionController:acceptPermissionsRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:acceptPermissionsRequest',
            {
              metadata: { id: 'DUMMY_ID', origin: 'https://example.com' },
              permissions: {},
            },
          ),
        ).not.toThrow(error);
      });
    });

    it('propagates errors other than PermissionsRequestNotFoundError', async () => {
      await withService(async ({ rootMessenger }) => {
        const error = new Error('Test error');
        rootMessenger.registerActionHandler(
          'PermissionController:acceptPermissionsRequest',
          jest.fn().mockImplementation(() => {
            throw error;
          }),
        );

        expect(() =>
          rootMessenger.call(
            'LegacyBackgroundApiService:acceptPermissionsRequest',
            {
              metadata: { id: 'DUMMY_ID', origin: 'https://example.com' },
              permissions: {},
            },
          ),
        ).toThrow(error);
      });
    });
  });

  describe('toggleExternalServices', () => {
    afterEach(() => {
      mockGetIsShieldSubscriptionActive.mockReset();
    });

    /**
     * Registers handlers for all actions used by `toggleExternalServices`.
     *
     * @param rootMessenger - The root messenger to register handlers on.
     * @returns The registered mock handlers, keyed by action.
     */
    function registerToggleExternalServicesHandlers(
      rootMessenger: RootMessenger,
    ) {
      const handlers = {
        toggleExternalServices: jest.fn(),
        getState: jest.fn().mockReturnValue({ subscriptions: [] }),
        enableTokenDetection: jest.fn(),
        disableTokenDetection: jest.fn(),
        enableGasFeeApis: jest.fn(),
        disableGasFeeApis: jest.fn(),
        stopAllPolling: jest.fn(),
        startShield: jest.fn(),
        stopShield: jest.fn(),
      };
      rootMessenger.registerActionHandler(
        'PreferencesController:toggleExternalServices',
        handlers.toggleExternalServices,
      );
      rootMessenger.registerActionHandler(
        'SubscriptionController:getState',
        handlers.getState,
      );
      rootMessenger.registerActionHandler(
        'TokenDetectionController:enable',
        handlers.enableTokenDetection,
      );
      rootMessenger.registerActionHandler(
        'TokenDetectionController:disable',
        handlers.disableTokenDetection,
      );
      rootMessenger.registerActionHandler(
        'GasFeeController:enableNonRPCGasFeeApis',
        handlers.enableGasFeeApis,
      );
      rootMessenger.registerActionHandler(
        'GasFeeController:disableNonRPCGasFeeApis',
        handlers.disableGasFeeApis,
      );
      rootMessenger.registerActionHandler(
        'SubscriptionController:stopAllPolling',
        handlers.stopAllPolling,
      );
      rootMessenger.registerActionHandler(
        'ShieldController:start',
        handlers.startShield,
      );
      rootMessenger.registerActionHandler(
        'ShieldController:stop',
        handlers.stopShield,
      );
      return handlers;
    }

    it('enables external services and starts shield when a subscription is active', async () => {
      mockGetIsShieldSubscriptionActive.mockReturnValue(true);

      await withService(({ rootMessenger }) => {
        const handlers = registerToggleExternalServicesHandlers(rootMessenger);

        rootMessenger.call(
          'LegacyBackgroundApiService:toggleExternalServices',
          true,
        );

        expect(handlers.toggleExternalServices).toHaveBeenCalledWith(true);
        expect(handlers.enableTokenDetection).toHaveBeenCalledTimes(1);
        expect(handlers.enableGasFeeApis).toHaveBeenCalledTimes(1);
        expect(handlers.startShield).toHaveBeenCalledTimes(1);
        expect(handlers.disableTokenDetection).not.toHaveBeenCalled();
        expect(handlers.stopAllPolling).not.toHaveBeenCalled();
        expect(handlers.stopShield).not.toHaveBeenCalled();
      });
    });

    it('enables external services without starting shield when no subscription is active', async () => {
      mockGetIsShieldSubscriptionActive.mockReturnValue(false);

      await withService(({ rootMessenger }) => {
        const handlers = registerToggleExternalServicesHandlers(rootMessenger);

        rootMessenger.call(
          'LegacyBackgroundApiService:toggleExternalServices',
          true,
        );

        expect(handlers.enableTokenDetection).toHaveBeenCalledTimes(1);
        expect(handlers.enableGasFeeApis).toHaveBeenCalledTimes(1);
        expect(handlers.startShield).not.toHaveBeenCalled();
      });
    });

    it('disables external services and stops shield when a subscription is active', async () => {
      mockGetIsShieldSubscriptionActive.mockReturnValue(true);

      await withService(({ rootMessenger }) => {
        const handlers = registerToggleExternalServicesHandlers(rootMessenger);

        rootMessenger.call(
          'LegacyBackgroundApiService:toggleExternalServices',
          false,
        );

        expect(handlers.toggleExternalServices).toHaveBeenCalledWith(false);
        expect(handlers.disableTokenDetection).toHaveBeenCalledTimes(1);
        expect(handlers.disableGasFeeApis).toHaveBeenCalledTimes(1);
        expect(handlers.stopAllPolling).toHaveBeenCalledTimes(1);
        expect(handlers.stopShield).toHaveBeenCalledTimes(1);
        expect(handlers.enableTokenDetection).not.toHaveBeenCalled();
        expect(handlers.startShield).not.toHaveBeenCalled();
      });
    });

    it('disables external services without stopping shield when no subscription is active', async () => {
      mockGetIsShieldSubscriptionActive.mockReturnValue(false);

      await withService(({ rootMessenger }) => {
        const handlers = registerToggleExternalServicesHandlers(rootMessenger);

        rootMessenger.call(
          'LegacyBackgroundApiService:toggleExternalServices',
          false,
        );

        expect(handlers.disableTokenDetection).toHaveBeenCalledTimes(1);
        expect(handlers.disableGasFeeApis).toHaveBeenCalledTimes(1);
        expect(handlers.stopAllPolling).toHaveBeenCalledTimes(1);
        expect(handlers.stopShield).not.toHaveBeenCalled();
      });
    });
  });

  describe('throwTestError', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('throws a TestError with the given message from a timeout handler', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.call('LegacyBackgroundApiService:throwTestError', 'boom');

        expect(() => jest.runAllTimers()).toThrow(
          expect.objectContaining({ name: 'TestError', message: 'boom' }),
        );
      });
    });
  });

  describe('captureTestError', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('captures a TestError with the given message from a timeout handler', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.call(
          'LegacyBackgroundApiService:captureTestError',
          'boom',
        );

        jest.runAllTimers();

        expect(captureException).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'TestError', message: 'boom' }),
        );
      });
    });
  });

  describe('createSeedPhraseBackup', () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const encodedSeedPhrase = Array.from(
      Buffer.from(mnemonic, 'utf8').values(),
    );

    it('captures the error and rethrows when backup creation fails', async () => {
      await withService(
        async ({ rootMessenger, service, serviceMessenger }) => {
          const error = new Error('backup failed');
          rootMessenger.registerActionHandler(
            'MetaMetricsController:bufferedTrace',
            jest.fn(),
          );
          rootMessenger.registerActionHandler(
            'MetaMetricsController:bufferedEndTrace',
            jest.fn(),
          );
          rootMessenger.registerActionHandler(
            'SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase',
            jest.fn().mockRejectedValue(error),
          );

          const captureExceptionSpy = jest.spyOn(
            serviceMessenger,
            'captureException',
          );

          await expect(
            service.createSeedPhraseBackup(
              'password',
              encodedSeedPhrase,
              'keyring-id',
            ),
          ).rejects.toThrow('backup failed');

          expect(captureExceptionSpy).toHaveBeenCalledWith(
            createSentryError(
              TraceName.OnboardingCreateKeyAndBackupSrpError,
              error,
            ),
          );
        },
      );
    });
  });

  describe('createNewVaultAndKeychain', () => {
    it('clears wallet state when a wallet reset is in progress', async () => {
      await withService(async ({ rootMessenger, service }) => {
        const clearPermissionState = jest.fn();
        const clearSnapState = jest.fn().mockResolvedValue(undefined);
        const clearAccountTreeState = jest.fn();
        const updateHiddenAccountsList = jest.fn();
        const clearUnapprovedTransactions = jest.fn();
        const createWallet = jest.fn().mockResolvedValue(undefined);
        const setIsWalletResetInProgress = jest.fn();
        const updateAccounts = jest.fn().mockResolvedValue(undefined);
        const reinit = jest.fn();
        const primaryKeyring = {
          type: 'HD Key Tree',
          accounts: ['0xabc'],
          metadata: { id: 'kr1' },
        };

        rootMessenger.registerActionHandler(
          'AppStateController:getIsWalletResetInProgress',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'PermissionController:clearState',
          clearPermissionState,
        );
        rootMessenger.registerActionHandler(
          'SnapController:clearState',
          clearSnapState,
        );
        rootMessenger.registerActionHandler(
          'AccountTreeController:clearState',
          clearAccountTreeState,
        );
        rootMessenger.registerActionHandler(
          'AccountOrderController:updateHiddenAccountsList',
          updateHiddenAccountsList,
        );
        rootMessenger.registerActionHandler(
          'TransactionController:clearUnapprovedTransactions',
          clearUnapprovedTransactions,
        );
        rootMessenger.registerActionHandler(
          'MultichainAccountService:createMultichainAccountWallet',
          createWallet,
        );
        rootMessenger.registerActionHandler(
          'AppStateController:setIsWalletResetInProgress',
          setIsWalletResetInProgress,
        );
        rootMessenger.registerActionHandler(
          'KeyringController:getState',
          jest.fn().mockReturnValue({ keyrings: [primaryKeyring] }),
        );
        rootMessenger.registerActionHandler(
          'AccountsController:updateAccounts',
          updateAccounts,
        );
        rootMessenger.registerActionHandler(
          'AccountTreeController:reinit',
          reinit,
        );

        const result = await service.createNewVaultAndKeychain('password');

        expect(clearPermissionState).toHaveBeenCalled();
        expect(clearSnapState).toHaveBeenCalled();
        expect(clearAccountTreeState).toHaveBeenCalled();
        expect(updateHiddenAccountsList).toHaveBeenCalledWith([]);
        expect(clearUnapprovedTransactions).toHaveBeenCalled();
        expect(createWallet).toHaveBeenCalledWith({
          type: 'create',
          password: 'password',
        });
        expect(setIsWalletResetInProgress).toHaveBeenCalledWith(false);
        expect(result).toStrictEqual(primaryKeyring);
      });
    });
  });

  describe('syncSeedPhrases', () => {
    it('imports private key secrets that are not backed up locally', async () => {
      await withService(async ({ rootMessenger, service }) => {
        const privateKeyData = new Uint8Array(32).fill(1);
        rootMessenger.registerActionHandler(
          'OnboardingController:getIsSocialLoginFlow',
          jest.fn().mockReturnValue(true),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:fetchAllSecretData',
          jest.fn().mockResolvedValue([
            { data: new Uint8Array([1]), type: SecretType.Mnemonic },
            { data: privateKeyData, type: SecretType.PrivateKey },
          ]),
        );
        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:getSecretDataBackupState',
          jest.fn().mockReturnValue(null),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedTrace',
          jest.fn(),
        );
        rootMessenger.registerActionHandler(
          'MetaMetricsController:bufferedEndTrace',
          jest.fn(),
        );

        const importSpy = jest
          .spyOn(service, 'importAccountWithStrategy')
          .mockResolvedValue(undefined);

        await service.syncSeedPhrases();

        expect(importSpy).toHaveBeenCalledWith(
          AccountImportStrategy.privateKey,
          [expect.any(String)],
          {
            shouldCreateSocialBackup: false,
            shouldSelectAccount: false,
          },
        );
      });
    });
  });

  describe('addNewSeedPhraseBackup', () => {
    const mnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    it('captures the error and rethrows when adding secret data fails', async () => {
      await withService(
        async ({ rootMessenger, service, serviceMessenger }) => {
          const error = new Error('add failed');
          rootMessenger.registerActionHandler(
            'OnboardingController:getState',
            jest.fn().mockReturnValue({ completedOnboarding: false }),
          );
          rootMessenger.registerActionHandler(
            'MetaMetricsController:bufferedTrace',
            jest.fn(),
          );
          rootMessenger.registerActionHandler(
            'MetaMetricsController:bufferedEndTrace',
            jest.fn(),
          );
          rootMessenger.registerActionHandler(
            'SeedlessOnboardingController:addNewSecretData',
            jest.fn().mockRejectedValue(error),
          );

          const captureExceptionSpy = jest.spyOn(
            serviceMessenger,
            'captureException',
          );

          await expect(
            service.addNewSeedPhraseBackup(mnemonic, 'keyring-id', true),
          ).rejects.toThrow('add failed');

          expect(captureExceptionSpy).toHaveBeenCalledWith(
            createSentryError(TraceName.OnboardingAddSrpError, error),
          );
        },
      );
    });
  });

  describe('discoverAndCreateAccounts', () => {
    it('counts discovered accounts by provider', async () => {
      await withService(async ({ rootMessenger, service }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:getState',
          jest.fn().mockReturnValue({
            keyrings: [{ metadata: { id: 'kr1' } }],
          }),
        );
        rootMessenger.registerActionHandler(
          'MultichainAccountService:getMultichainAccountWallet',
          jest.fn().mockReturnValue({
            discoverAccounts: jest
              .fn()
              .mockResolvedValue([
                { type: SolAccountType.DataAccount },
                { type: BtcAccountType.P2wpkh },
                { type: TrxAccountType.Eoa },
              ]),
          }),
        );

        const counts = await service.discoverAndCreateAccounts();

        expect(counts).toStrictEqual({ Bitcoin: 1, Solana: 1, Tron: 1 });
      });
    });
  });

  describe('isRelaySupported', () => {
    const isRelaySupportedMock = jest.mocked(isRelaySupported);

    it('delegates to the transaction relay lib and returns its result', async () => {
      isRelaySupportedMock.mockResolvedValue(true);

      await withService(async ({ rootMessenger }) => {
        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:isRelaySupported',
          '0x1',
        );

        expect(isRelaySupportedMock).toHaveBeenCalledWith('0x1');
        expect(result).toBe(true);
      });
    });
  });

  describe('DeFi referral', () => {
    const HYPERLIQUID = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid];
    const GMX = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.GMX];
    const mockTabId = 140;
    const mockPermittedAccount = '0x123';
    const mockPermittedAccounts = [mockPermittedAccount, '0x456'];

    type ReferralHandlerOverrides = {
      featureFlags?: Record<string, boolean>;
      hasRequest?: boolean;
      addResult?: unknown;
      referrals?: Record<string, Record<string, ReferralStatus>>;
      useExternalServices?: boolean;
    };

    /**
     * Registers the messenger action handlers used by the referral flow.
     *
     * @param rootMessenger - The root messenger to register handlers on.
     * @param overrides - Overrides for the mocked controller state/behavior.
     * @returns The registered jest mock handlers, for assertions.
     */
    function registerReferralHandlers(
      rootMessenger: RootMessenger,
      overrides: ReferralHandlerOverrides = {},
    ) {
      const {
        featureFlags = {
          [DefiReferralPartner.Hyperliquid]: true,
          [DefiReferralPartner.GMX]: true,
        },
        hasRequest = false,
        addResult = {},
        referrals = {
          [DefiReferralPartner.Hyperliquid]: {},
          [DefiReferralPartner.GMX]: {},
        },
        useExternalServices = false,
      } = overrides;

      const handlers = {
        add: jest.fn().mockResolvedValue(addResult),
        hasRequest: jest.fn().mockReturnValue(hasRequest),
        addReferralPassedAccount: jest.fn(),
        addReferralApprovedAccount: jest.fn(),
        addReferralDeclinedAccount: jest.fn(),
        removeReferralDeclinedAccount: jest.fn(),
        setAccountsReferralApproved: jest.fn(),
      };

      rootMessenger.registerActionHandler(
        'RemoteFeatureFlagController:getState',
        jest.fn().mockReturnValue({
          remoteFeatureFlags: {
            extensionUxDefiReferralPartners: featureFlags,
          },
        }),
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:getState',
        jest.fn().mockReturnValue({ referrals, useExternalServices }),
      );
      rootMessenger.registerActionHandler(
        'ApprovalController:hasRequest',
        handlers.hasRequest,
      );
      rootMessenger.registerActionHandler(
        'ApprovalController:add',
        handlers.add,
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:addReferralPassedAccount',
        handlers.addReferralPassedAccount,
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:addReferralApprovedAccount',
        handlers.addReferralApprovedAccount,
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:addReferralDeclinedAccount',
        handlers.addReferralDeclinedAccount,
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:removeReferralDeclinedAccount',
        handlers.removeReferralDeclinedAccount,
      );
      rootMessenger.registerActionHandler(
        'PreferencesController:setAccountsReferralApproved',
        handlers.setAccountsReferralApproved,
      );

      return handlers;
    }

    /**
     * Registers the Arbitrum network handlers used by the GMX on-chain check.
     *
     * @param rootMessenger - The root messenger to register handlers on.
     */
    function registerArbitrumNetwork(rootMessenger: RootMessenger) {
      rootMessenger.registerActionHandler(
        'NetworkController:findNetworkClientIdByChainId',
        jest.fn().mockReturnValue('arbitrum'),
      );
      rootMessenger.registerActionHandler(
        'NetworkController:getNetworkClientById',
        jest.fn().mockReturnValue({ provider: { request: jest.fn() } }),
      );
    }

    beforeEach(() => {
      jest.mocked(trackEvent).mockClear();
      jest.mocked(checkGmxHasReferralCode).mockReset().mockResolvedValue(false);
      jest
        .mocked(checkHyperliquidHasReferralCode)
        .mockReset()
        .mockResolvedValue(false);
    });

    describe('handleDefiReferral', () => {
      it('returns early if the partner feature flag is not enabled', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger, {
              featureFlags: { [DefiReferralPartner.Hyperliquid]: false },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(getPermittedAccounts).not.toHaveBeenCalled();
          },
        );
      });

      it('returns early if the partner has no permitted accounts', async () => {
        const getPermittedAccounts = jest.fn().mockResolvedValue([]);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.hasRequest).not.toHaveBeenCalled();
            expect(handlers.add).not.toHaveBeenCalled();
          },
        );
      });

      it('returns early if there is already a pending approval', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              hasRequest: true,
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.hasRequest).toHaveBeenCalledWith({
              origin: HYPERLIQUID.origin,
              type: HYPERLIQUID.approvalType,
            });
            expect(handlers.add).not.toHaveBeenCalled();
          },
        );
      });

      it('returns early if the account has already interacted with the referral', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              referrals: {
                [DefiReferralPartner.Hyperliquid]: {
                  [mockPermittedAccount]: ReferralStatus.Passed,
                },
              },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.add).not.toHaveBeenCalled();
          },
        );
      });

      it('triggers approval with pop-up for a new unprocessed account on new connection', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.add).toHaveBeenCalledWith({
              origin: HYPERLIQUID.origin,
              type: HYPERLIQUID.approvalType,
              requestData: {
                learnMoreUrl: HYPERLIQUID.learnMoreUrl,
                partnerId: DefiReferralPartner.Hyperliquid,
                partnerName: HYPERLIQUID.name,
                selectedAddress: mockPermittedAccount,
              },
              shouldShowRequest: true,
            });
          },
        );
      });

      it('uses activePermittedAddressOverride for approval when it matches a later permitted account', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              addResult: { approved: true },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
              { activePermittedAddressOverride: '0x456' },
            );

            expect(handlers.add).toHaveBeenCalledWith(
              expect.objectContaining({
                requestData: expect.objectContaining({
                  selectedAddress: '0x456',
                }),
              }),
            );
            // approved with no previously declined accounts approves them all
            expect(handlers.setAccountsReferralApproved).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccounts,
            );
          },
        );
      });

      it('uses caveat address casing when activePermittedAddressOverride matches case-insensitively', async () => {
        const caveatAddress = '0xAbCdEf0000000000000000000000000000000001';
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue([caveatAddress, '0x456']);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
              { activePermittedAddressOverride: caveatAddress.toLowerCase() },
            );

            expect(handlers.add).toHaveBeenCalledWith(
              expect.objectContaining({
                requestData: expect.objectContaining({
                  selectedAddress: caveatAddress,
                }),
              }),
            );
          },
        );
      });

      it('triggers approval without pop-up on navigate to connected tab', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.OnNavigateConnectedTab,
            );

            expect(handlers.add).toHaveBeenCalledWith(
              expect.objectContaining({ shouldShowRequest: false }),
            );
          },
        );
      });

      it('triggers approval without pop-up when permitted account was added via background API', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.PermittedAccountAdded,
            );

            expect(handlers.add).toHaveBeenCalledWith(
              expect.objectContaining({ shouldShowRequest: false }),
            );
          },
        );
      });

      it('handles user approval with no previously declined accounts', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          {
            options: {
              getPermittedAccounts,
              getTabUrl: jest
                .fn()
                .mockResolvedValue(`${HYPERLIQUID.origin}/trade`),
            },
          },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              addResult: { approved: true },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.setAccountsReferralApproved).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccounts,
            );
            // redirect marks the account as passed
            expect(handlers.addReferralPassedAccount).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccount,
            );
          },
        );
      });

      it('handles user approval and unwinds a previously declined account', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          {
            options: {
              getPermittedAccounts,
              getTabUrl: jest
                .fn()
                .mockResolvedValue(`${HYPERLIQUID.origin}/trade`),
            },
          },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              addResult: { approved: true },
              referrals: {
                [DefiReferralPartner.Hyperliquid]: {
                  '0x456': ReferralStatus.Declined,
                },
              },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.addReferralApprovedAccount).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccount,
            );
            expect(handlers.removeReferralDeclinedAccount).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              '0x456',
            );
          },
        );
      });

      it('handles user decline', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              addResult: { approved: false },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.addReferralDeclinedAccount).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccount,
            );
            expect(handlers.setAccountsReferralApproved).not.toHaveBeenCalled();
          },
        );
      });

      it('does not emit events if the user has a pending approval', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger, { hasRequest: true });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(trackEvent).not.toHaveBeenCalled();
          },
        );
      });

      it('emits a "Referral Viewed" event when the approval screen is shown', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger);

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(trackEvent).toHaveBeenCalledWith(
              expect.objectContaining({
                name: 'Referral Viewed',
                properties: expect.objectContaining({
                  category: 'Referrals',
                  url: HYPERLIQUID.origin,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  trigger_type: ReferralTriggerType.NewConnection,
                }),
              }),
            );
          },
        );
      });

      it('emits a "Referral Confirm Button Clicked" event when the user confirms', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          {
            options: {
              getPermittedAccounts,
              getTabUrl: jest
                .fn()
                .mockResolvedValue(`${HYPERLIQUID.origin}/trade`),
            },
          },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger, {
              addResult: { approved: true },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(trackEvent).toHaveBeenCalledWith(
              expect.objectContaining({
                name: 'Referral Confirm Button Clicked',
                properties: expect.objectContaining({
                  category: 'Referrals',
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  opt_in: true,
                  url: HYPERLIQUID.origin,
                }),
              }),
            );
          },
        );
      });

      it('emits a "Referral Confirm Button Clicked" event when the user declines', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        await withService(
          { options: { getPermittedAccounts } },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger, {
              addResult: { approved: false },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(trackEvent).toHaveBeenCalledWith(
              expect.objectContaining({
                name: 'Referral Confirm Button Clicked',
                properties: expect.objectContaining({
                  category: 'Referrals',
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  opt_in: false,
                  url: HYPERLIQUID.origin,
                }),
              }),
            );
          },
        );
      });

      it('redirects and does not show approval when the account is already approved', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        const updateTabUrl = jest.fn().mockResolvedValue(undefined);
        await withService(
          {
            options: {
              getPermittedAccounts,
              getTabUrl: jest
                .fn()
                .mockResolvedValue(`${HYPERLIQUID.origin}/trade`),
              updateTabUrl,
            },
          },
          async ({ rootMessenger }) => {
            const handlers = registerReferralHandlers(rootMessenger, {
              referrals: {
                [DefiReferralPartner.Hyperliquid]: {
                  [mockPermittedAccount]: ReferralStatus.Approved,
                },
              },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            expect(handlers.add).not.toHaveBeenCalled();
            expect(updateTabUrl).toHaveBeenCalled();
            expect(handlers.addReferralPassedAccount).toHaveBeenCalledWith(
              DefiReferralPartner.Hyperliquid,
              mockPermittedAccount,
            );
          },
        );
      });

      it('merges the current tab query params into the referral URL on redirect', async () => {
        const getPermittedAccounts = jest
          .fn()
          .mockResolvedValue(mockPermittedAccounts);
        const updateTabUrl = jest.fn().mockResolvedValue(undefined);
        await withService(
          {
            options: {
              getPermittedAccounts,
              getTabUrl: jest
                .fn()
                .mockResolvedValue(`${HYPERLIQUID.origin}/trade?foo=bar`),
              updateTabUrl,
            },
          },
          async ({ rootMessenger }) => {
            registerReferralHandlers(rootMessenger, {
              referrals: {
                [DefiReferralPartner.Hyperliquid]: {
                  [mockPermittedAccount]: ReferralStatus.Approved,
                },
              },
            });

            await rootMessenger.call(
              'LegacyBackgroundApiService:handleDefiReferral',
              HYPERLIQUID,
              mockTabId,
              ReferralTriggerType.NewConnection,
            );

            const updatedUrl = new URL(updateTabUrl.mock.calls[0][1]);
            // preserves the existing tab param
            expect(updatedUrl.searchParams.get('foo')).toBe('bar');
            // adds the partner referral param
            expect(updatedUrl.pathname + updatedUrl.search).toContain('MMREF');
          },
        );
      });

      describe('GMX on-chain referral code check', () => {
        it('marks the account as passed and returns early when a code already exists', async () => {
          jest.mocked(checkGmxHasReferralCode).mockResolvedValue(true);
          const getPermittedAccounts = jest
            .fn()
            .mockResolvedValue(mockPermittedAccounts);
          await withService(
            { options: { getPermittedAccounts } },
            async ({ rootMessenger }) => {
              const handlers = registerReferralHandlers(rootMessenger);
              registerArbitrumNetwork(rootMessenger);

              await rootMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                GMX,
                mockTabId,
                ReferralTriggerType.NewConnection,
              );

              expect(handlers.addReferralPassedAccount).toHaveBeenCalledWith(
                DefiReferralPartner.GMX,
                mockPermittedAccount,
              );
              expect(handlers.add).not.toHaveBeenCalled();
            },
          );
        });

        it('proceeds to show the prompt when the wallet has no GMX referral code', async () => {
          jest.mocked(checkGmxHasReferralCode).mockResolvedValue(false);
          const getPermittedAccounts = jest
            .fn()
            .mockResolvedValue(mockPermittedAccounts);
          await withService(
            { options: { getPermittedAccounts } },
            async ({ rootMessenger }) => {
              const handlers = registerReferralHandlers(rootMessenger);
              registerArbitrumNetwork(rootMessenger);

              await rootMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                GMX,
                mockTabId,
                ReferralTriggerType.NewConnection,
              );

              expect(handlers.add).toHaveBeenCalledWith(
                expect.objectContaining({
                  origin: GMX.origin,
                  type: GMX.approvalType,
                }),
              );
            },
          );
        });

        it('does not run the GMX check for non-GMX partners', async () => {
          const getPermittedAccounts = jest
            .fn()
            .mockResolvedValue(mockPermittedAccounts);
          await withService(
            { options: { getPermittedAccounts } },
            async ({ rootMessenger }) => {
              registerReferralHandlers(rootMessenger);

              await rootMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                HYPERLIQUID,
                mockTabId,
                ReferralTriggerType.NewConnection,
              );

              expect(checkGmxHasReferralCode).not.toHaveBeenCalled();
            },
          );
        });
      });

      describe('Hyperliquid API referral code check', () => {
        it('marks the account as passed and returns early when a code already exists', async () => {
          jest.mocked(checkHyperliquidHasReferralCode).mockResolvedValue(true);
          const getPermittedAccounts = jest
            .fn()
            .mockResolvedValue(mockPermittedAccounts);
          await withService(
            { options: { getPermittedAccounts } },
            async ({ rootMessenger }) => {
              const handlers = registerReferralHandlers(rootMessenger, {
                useExternalServices: true,
              });

              await rootMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                HYPERLIQUID,
                mockTabId,
                ReferralTriggerType.NewConnection,
              );

              expect(handlers.addReferralPassedAccount).toHaveBeenCalledWith(
                DefiReferralPartner.Hyperliquid,
                mockPermittedAccount,
              );
              expect(handlers.add).not.toHaveBeenCalled();
            },
          );
        });

        it('does not run the Hyperliquid check when basic functionality is disabled', async () => {
          const getPermittedAccounts = jest
            .fn()
            .mockResolvedValue(mockPermittedAccounts);
          await withService(
            { options: { getPermittedAccounts } },
            async ({ rootMessenger }) => {
              registerReferralHandlers(rootMessenger, {
                useExternalServices: false,
              });

              await rootMessenger.call(
                'LegacyBackgroundApiService:handleDefiReferral',
                HYPERLIQUID,
                mockTabId,
                ReferralTriggerType.NewConnection,
              );

              expect(checkHyperliquidHasReferralCode).not.toHaveBeenCalled();
            },
          );
        });
      });
    });

    describe('handleDefiReferralOnPermittedAccountsAdded', () => {
      const evmAccount = createMockInternalAccount({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });
      const { namespace, reference } = parseCaipChainId(evmAccount.scopes[0]);
      const caipAccountId = toCaipAccountId(
        namespace,
        reference,
        evmAccount.address,
      );

      /**
       * Registers the AccountsController state handler.
       *
       * @param rootMessenger - The root messenger.
       * @param options - Overrides for the internal accounts state.
       * @param options.accounts - The internal accounts map.
       * @param options.selectedAccount - The selected account id.
       */
      function registerAccounts(
        rootMessenger: RootMessenger,
        {
          accounts = { [evmAccount.id]: evmAccount },
          selectedAccount = evmAccount.id,
        }: {
          accounts?: Record<string, unknown>;
          selectedAccount?: string;
        } = {},
      ) {
        rootMessenger.registerActionHandler(
          'AccountsController:getState',
          jest.fn().mockReturnValue({
            internalAccounts: { accounts, selectedAccount },
          }),
        );
      }

      /**
       * Registers the AppStateController state handler.
       *
       * @param rootMessenger - The root messenger.
       * @param appActiveTab - The active tab to return.
       */
      function registerAppTab(
        rootMessenger: RootMessenger,
        appActiveTab: unknown,
      ) {
        rootMessenger.registerActionHandler(
          'AppStateController:getState',
          jest.fn().mockReturnValue({ appActiveTab }),
        );
      }

      it('calls handleDefiReferral when the selected EVM account matches a new permitted id and the tab matches', async () => {
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, {
            id: 914,
            origin: HYPERLIQUID.origin,
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).toHaveBeenCalledWith(
            HYPERLIQUID,
            914,
            ReferralTriggerType.PermittedAccountAdded,
            { activePermittedAddressOverride: evmAccount.address },
          );
        });
      });

      it('does nothing when the origin does not match a referral partner', async () => {
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, {
            id: 914,
            origin: HYPERLIQUID.origin,
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: 'https://example.com',
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('does nothing when the selected account is not EVM', async () => {
        const solAccount = createMockInternalAccount({
          type: SolAccountType.DataAccount,
        });
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger, {
            accounts: { [solAccount.id]: solAccount },
            selectedAccount: solAccount.id,
          });
          registerAppTab(rootMessenger, {
            id: 914,
            origin: HYPERLIQUID.origin,
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('does nothing when the new permitted ids do not include the selected account', async () => {
        const otherCaipId = toCaipAccountId(
          'eip155',
          '1',
          '0x0000000000000000000000000000000000000001',
        );
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, {
            id: 914,
            origin: HYPERLIQUID.origin,
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [otherCaipId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('does nothing when the active tab origin does not match', async () => {
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, {
            id: 914,
            origin: 'https://example.com',
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('does nothing when the active tab has no numeric id', async () => {
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, {
            id: 'not-a-number',
            origin: HYPERLIQUID.origin,
          });

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('does nothing when there is no active tab', async () => {
        await withService(async ({ service, rootMessenger }) => {
          const spy = jest
            .spyOn(service, 'handleDefiReferral')
            .mockResolvedValue(undefined);
          registerAccounts(rootMessenger);
          registerAppTab(rootMessenger, undefined);

          service.handleDefiReferralOnPermittedAccountsAdded({
            origin: HYPERLIQUID.origin,
            newCaipAccountIds: [caipAccountId],
          });

          expect(spy).not.toHaveBeenCalled();
        });
      });
    });
  });
});

/**
 * The type of the messenger populated with all external actions and events
 * required by the service under test.
 */
type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<LegacyBackgroundApiServiceMessenger>,
  MessengerEvents<LegacyBackgroundApiServiceMessenger>
>;

/**
 * The callback that `withService` calls.
 */
type WithServiceCallback<ReturnValue> = (payload: {
  service: LegacyBackgroundApiService;
  rootMessenger: RootMessenger;
  serviceMessenger: LegacyBackgroundApiServiceMessenger;
}) => Promise<ReturnValue> | ReturnValue;

/**
 * The options that `withService` takes.
 */
type WithServiceOptions = {
  options: Partial<ConstructorParameters<typeof LegacyBackgroundApiService>[0]>;
};

/**
 * Constructs the messenger populated with all external actions and events
 * required by the service under test.
 *
 * @returns The root messenger.
 */
function getRootMessenger(): RootMessenger {
  return new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
    captureException: jest.fn(),
  });
}

/**
 * Constructs the messenger for the service under test.
 *
 * @param rootMessenger - The root messenger, with all external actions and
 * events required by the service's messenger.
 * @returns The service-specific messenger.
 */
function getMessenger(
  rootMessenger: RootMessenger,
): LegacyBackgroundApiServiceMessenger {
  const serviceMessenger: LegacyBackgroundApiServiceMessenger = new Messenger({
    namespace: 'LegacyBackgroundApiService',
    parent: rootMessenger,
  });

  rootMessenger.delegate({
    messenger: serviceMessenger,
    actions: [
      'NetworkController:getState',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getNetworkClientById',
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:lookupNetwork',
      'NetworkEnablementController:getState',
      'NetworkEnablementController:enableNetwork',
      'NetworkEnablementController:enableAllPopularNetworks',
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:setCurrentCurrency',
      'AssetsContractController:getTokenStandardAndDetails',
      'AssetsController:getAssets',
      'AssetsController:getState',
      'AssetsController:setSelectedCurrency',
      'TokenListController:getState',
      'TokensController:getState',
      'KeyringController:exportSeedPhrase',
      'KeyringController:getState',
      'AccountsController:getSelectedAccount',
      'AccountsController:getState',
      'ApprovalController:add',
      'ApprovalController:getState',
      'ApprovalController:hasRequest',
      'ApprovalController:acceptRequest',
      'AppStateController:getState',
      'SnapInterfaceController:deleteInterface',
      'SnapController:clearState',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'TransactionController:clearUnapprovedTransactions',
      'ApprovalController:rejectRequest',
      'TransactionController:wipeTransactions',
      'SmartTransactionsController:wipeSmartTransactions',
      'BridgeStatusController:wipeBridgeStatus',
      'NetworkController:resetConnection',
      'KeyringController:importAccountWithStrategy',
      'OnboardingController:getIsSocialLoginFlow',
      'KeyringController:withController',
      'KeyringController:withKeyringV2',
      'KeyringController:removeAccount',
      'AccountsController:getAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:listAccounts',
      'AccountsController:setAccountName',
      'AccountsController:setSelectedAccount',
      'SeedlessOnboardingController:addNewSecretData',
      'SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase',
      'SeedlessOnboardingController:fetchAllSecretData',
      'SeedlessOnboardingController:getSecretDataBackupState',
      'SeedlessOnboardingController:updateBackupMetadataState',
      'PermissionController:clearState',
      'PermissionController:rejectPermissionsRequest',
      'PermissionController:revokePermissions',
      'PermissionController:updatePermissionsByCaveat',
      'PreferencesController:getState',
      'PreferencesController:addReferralApprovedAccount',
      'PreferencesController:addReferralDeclinedAccount',
      'PreferencesController:addReferralPassedAccount',
      'PreferencesController:removeReferralDeclinedAccount',
      'PreferencesController:setAccountsReferralApproved',
      'PreferencesController:setPasswordForgotten',
      'PasskeyController:unlockWithPasskey',
      'PasskeyController:changePasswordWithPasskeyVerification',
      'OnboardingController:getState',
      'SeedlessOnboardingController:checkIsPasswordOutdated',
      'SeedlessOnboardingController:getState',
      'SeedlessOnboardingController:runMigrations',
      'KeyringController:verifyPassword',
      'KeyringController:exportAccount',
      'KeyringController:changePassword',
      'KeyringController:exportEncryptionKey',
      'KeyringController:setLocked',
      'KeyringController:submitEncryptionKey',
      'KeyringController:submitPassword',
      'SeedlessOnboardingController:changePassword',
      'SeedlessOnboardingController:loadKeyringEncryptionKey',
      'SeedlessOnboardingController:revokePendingRefreshTokens',
      'SeedlessOnboardingController:setLocked',
      'SeedlessOnboardingController:storeKeyringEncryptionKey',
      'SeedlessOnboardingController:submitGlobalPassword',
      'SeedlessOnboardingController:submitPassword',
      'SeedlessOnboardingController:syncLatestGlobalPassword',
      'AccountsController:updateAccounts',
      'AccountOrderController:updateHiddenAccountsList',
      'AccountTreeController:clearState',
      'AccountTreeController:init',
      'AccountTreeController:reinit',
      'AccountTreeController:getSelectedAccountGroup',
      'AccountTreeController:syncWithUserStorage',
      'AccountTreeController:syncWithUserStorageAtLeastOnce',
      'AppStateController:getIsWalletResetInProgress',
      'AppStateController:setIsWalletResetInProgress',
      'MultichainAccountService:createMultichainAccountWallet',
      'MultichainAccountService:getMultichainAccountWallet',
      'MultichainAccountService:init',
      'MultichainAccountService:removeMultichainAccountWallet',
      'MultichainAccountService:resyncAccounts',
      'MultichainAccountService:alignWallets',
      'SubscriptionController:stopAllPolling',
      'AuthenticationController:getState',
      'AuthenticationController:performSignOut',
      'AppStateController:setPasskeyAutoUnlockSuppressed',
      'AppStateController:setTrezorModel',
      'KeyringController:withKeyringV2Unsafe',
      'MetaMetricsController:getEventFragmentById',
      'MetaMetricsController:updateEventFragment',
      'MetaMetricsController:createEventFragment',
      'MetaMetricsController:bufferedTrace',
      'MetaMetricsController:bufferedEndTrace',
      'TransactionController:updateEditableParams',
      'TransactionController:estimateGas',
      'TransactionController:isAtomicBatchSupported',
      'DelegationController:signDelegation',
      'KeyringController:signEip7702Authorization',
      'PermissionController:acceptPermissionsRequest',
      'PhishingController:maybeUpdateState',
      'PhishingController:testOrigin',
      'PreferencesController:toggleExternalServices',
      'SubscriptionController:getState',
      'TokenDetectionController:enable',
      'TokenDetectionController:disable',
      'GasFeeController:enableNonRPCGasFeeApis',
      'GasFeeController:disableNonRPCGasFeeApis',
      'ShieldController:start',
      'ShieldController:stop',
      'TransactionController:addTransaction',
      'TransactionController:addTransactionBatch',
      'TransactionController:updateSecurityAlertResponse',
      'UserOperationController:addUserOperationFromTransaction',
      'UserOperationController:startPollingByNetworkClientId',
      'PPOMController:usePPOM',
      'KeyringController:getKeyringForAccount',
      'SignatureController:getState',
      'AppStateController:getAddressSecurityAlertResponse',
      'AppStateController:addAddressSecurityAlertResponse',
      'AppStateController:addSignatureSecurityAlertResponse',
      'SubscriptionController:getSubscriptionByProduct',
      'AuthenticationController:getBearerToken',
    ],
    events: [
      'TransactionController:unapprovedTransactionAdded',
      'SignatureController:stateChange',
    ],
  });

  return serviceMessenger;
}

/**
 * Wrap tests for the service under test by ensuring that the service is
 * created ahead of time and then safely destroyed afterward as needed.
 *
 * @param args - Either a function, or an options bag + a function. The options
 * bag contains arguments for the service constructor. All constructor
 * arguments are optional and will be filled in with defaults in as needed
 * (including `messenger`). The function is called with the instantiated
 * service, root messenger, and service messenger.
 * @returns The same return value as the given function.
 */
async function withService<ReturnValue>(
  ...args:
    | [WithServiceCallback<ReturnValue>]
    | [WithServiceOptions, WithServiceCallback<ReturnValue>]
): Promise<ReturnValue> {
  const [{ options = {} }, testFunction] =
    args.length === 2 ? args : [{}, args[0]];
  const rootMessenger = getRootMessenger();
  const serviceMessenger = getMessenger(rootMessenger);
  const service = new LegacyBackgroundApiService({
    messenger: serviceMessenger,
    infuraProjectId: 'test-infura-project-id',
    getRequestAccountTabIds: () => ({}),
    getOpenMetamaskTabsIds: () => ({}),
    getPermittedAccounts: jest.fn().mockResolvedValue([]),
    getTabUrl: jest.fn().mockResolvedValue(undefined),
    updateTabUrl: jest.fn().mockResolvedValue(undefined),
    markNotificationPopupAsAutomaticallyClosed: jest.fn(),
    requestSafeReload: jest.fn(),
    sendUpdate: jest.fn(),
    seedlessOperationMutex: new Mutex(),
    offscreenPromise: Promise.resolve(),
    ...options,
  });
  return await testFunction({ service, rootMessenger, serviceMessenger });
}

/**
 * Registers handlers for the downstream actions that are triggered as side
 * effects of unlocking the vault (e.g. via `submitPasswordOrEncryptionKey`), so
 * that tests focused on the unlock flow do not need to register each of them
 * individually.
 *
 * @param rootMessenger - The root messenger to register the handlers on.
 */
function registerUnlockSideEffectHandlers(rootMessenger: RootMessenger): void {
  rootMessenger.registerActionHandler(
    'AccountsController:updateAccounts',
    jest.fn(),
  );
  rootMessenger.registerActionHandler(
    'MultichainAccountService:init',
    jest.fn(),
  );
  rootMessenger.registerActionHandler('AccountTreeController:init', jest.fn());
  rootMessenger.registerActionHandler(
    'KeyringController:getKeyringsByType',
    jest.fn().mockReturnValue([{ setSelectedAccounts: jest.fn() }]),
  );
  rootMessenger.registerActionHandler(
    'AccountTreeController:getSelectedAccountGroup',
    jest.fn().mockReturnValue(''),
  );
  rootMessenger.registerActionHandler(
    'MultichainAccountService:resyncAccounts',
    jest.fn(),
  );
  rootMessenger.registerActionHandler(
    'MultichainAccountService:alignWallets',
    jest.fn(),
  );
}
