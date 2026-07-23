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
import {
  TransactionContainerType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { add0x, hexToBytes, type Hex } from '@metamask/utils';
import {
  EncAccountDataType,
  SecretType,
  RecoveryError,
  SeedlessOnboardingControllerErrorMessage,
} from '@metamask/seedless-onboarding-controller';
import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { PermissionsRequestNotFoundError } from '@metamask/permission-controller';
import { ApprovalRequestNotFoundError } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { providerErrors } from '@metamask/rpc-errors';
import { SnapId } from '@metamask/snaps-sdk';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
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
import { decodeTransactionData } from '../lib/transaction/decode/util';
import {
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger,
} from './legacy-background-api-service';

jest.unmock('../../../shared/lib/assets-unify-state/remote-feature-flag');

jest.mock('../lib/transaction/containers/enforced-simulations');

jest.mock('../../../shared/lib/shield/subscription-utils', () => ({
  ...jest.requireActual('../../../shared/lib/shield/subscription-utils'),
  getIsShieldSubscriptionActive: jest.fn(),
}));

const mockGetIsShieldSubscriptionActive = jest.mocked(
  getIsShieldSubscriptionActive,
);

jest.mock('../lib/transaction/sentinel-api');
jest.mock('../lib/transaction/transaction-relay');
jest.mock('../lib/transaction/decode/util');
jest.mock('../../../shared/lib/sentry');

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
          { ...options, forceUpdate: true },
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
          { address: selectedAddress, chainId: '0x1' },
        );

        expect(callSpy).toHaveBeenCalledWith(
          'SmartTransactionsController:wipeSmartTransactions',
          { address: selectedAddress, ignoreNetwork: false },
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
          { properties: { foo: 'bar' } },
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
            { captureSentryError: true },
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
            { encryptionKey: 'encryption-key' },
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
            { password: 'password' },
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
            { password: 'password' },
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
          { globalPassword: 'global-password', maxKeyChainLength: 20 },
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

        const updateEditableParamsMock = jest.fn();
        rootMessenger.registerActionHandler(
          'TransactionController:updateEditableParams',
          updateEditableParamsMock,
        );

        await rootMessenger.call(
          'LegacyBackgroundApiService:applyTransactionContainersExisting',
          TRANSACTION_ID_MOCK,
          [TransactionContainerType.EnforcedSimulations],
        );

        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          TRANSACTION_ID_MOCK,
          expect.objectContaining({
            containerTypes: [TransactionContainerType.EnforcedSimulations],
            data: NEW_DATA_MOCK,
            gas: ESTIMATE_GAS_MOCK,
          }),
        );
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
          { code: 1, message: 'DUMMY_MESSAGE', data: 'DUMMY_DATA' },
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
            { code: 1, message: 'DUMMY_MESSAGE', data: 'DUMMY_DATA' },
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
            { code: 1, message: 'DUMMY_MESSAGE', data: 'DUMMY_DATA' },
          ),
        ).toThrow(error);
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

  describe('throwLavamoatError', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('throws a LavaMoat with the given message from a timeout handler', async () => {
      await withService(({ rootMessenger }) => {
        rootMessenger.call('LegacyBackgroundApiService:throwLavamoatError', 'boom');

        expect(() => jest.runAllTimers()).toThrow(
          expect.objectContaining({ name: 'TestError', message: 'boom' }),
        );
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
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:setCurrentCurrency',
      'AssetsController:getAssets',
      'AssetsController:setSelectedCurrency',
      'KeyringController:exportSeedPhrase',
      'AccountsController:getSelectedAccount',
      'ApprovalController:getState',
      'ApprovalController:acceptRequest',
      'SnapInterfaceController:deleteInterface',
      'TransactionController:getNonceLock',
      'TransactionController:getState',
      'ApprovalController:rejectRequest',
      'TransactionController:wipeTransactions',
      'SmartTransactionsController:wipeSmartTransactions',
      'BridgeStatusController:wipeBridgeStatus',
      'NetworkController:resetConnection',
      'KeyringController:importAccountWithStrategy',
      'OnboardingController:getIsSocialLoginFlow',
      'KeyringController:withKeyringV2',
      'KeyringController:removeAccount',
      'AccountsController:getAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setAccountName',
      'AccountsController:setSelectedAccount',
      'SeedlessOnboardingController:addNewSecretData',
      'SeedlessOnboardingController:updateBackupMetadataState',
      'PermissionController:rejectPermissionsRequest',
      'PermissionController:revokePermissions',
      'PermissionController:updatePermissionsByCaveat',
      'PreferencesController:setPasswordForgotten',
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
      'AccountTreeController:init',
      'AccountTreeController:getSelectedAccountGroup',
      'MultichainAccountService:init',
      'MultichainAccountService:resyncAccounts',
      'MultichainAccountService:alignWallets',
      'SubscriptionController:stopAllPolling',
      'AuthenticationController:getState',
      'AuthenticationController:performSignOut',
      'AppStateController:setPasskeyAutoUnlockSuppressed',
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
    sendUpdate: jest.fn(),
    seedlessOperationMutex: new Mutex(),
    createVaultMutex: new Mutex(),
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
