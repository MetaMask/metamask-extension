import { Mutex } from 'async-mutex';
import {
  Messenger,
  MessengerActions,
  MessengerEvents,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { SupportedCurrency } from '@metamask/core-backend';
import {
  AccountImportStrategy,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { add0x, hexToBytes } from '@metamask/utils';
import { SecretType } from '@metamask/seedless-onboarding-controller';
import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { SnapId } from '@metamask/snaps-sdk';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import mockState from '../../../test/data/mock-state.json';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import {
  LegacyBackgroundApiService,
  LegacyBackgroundApiServiceMessenger,
} from './legacy-background-api-service';

jest.unmock('../../../shared/lib/assets-unify-state/remote-feature-flag');

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

        expect(result).toStrictEqual(false);
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

        expect(result).toStrictEqual(false);
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

        expect(result).toStrictEqual(false);
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
          'ApprovalController:getState',
          jest.fn().mockReturnValue({
            pendingApprovals: {
              foo: {
                id: 'foo',
                type: SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage,
                requestState: {
                  txId: 'bar',
                },
              },
            },
          }),
        );

        rootMessenger.registerActionHandler(
          'TransactionController:getState',
          jest.fn().mockReturnValue({
            transactions: [
              {
                id: 'bar',
                chainId: '0x1',
                txParams: {
                  from: selectedAddress,
                },
              },
            ],
          }),
        );

        rootMessenger.registerActionHandler(
          'ApprovalController:rejectRequest',
          jest.fn(),
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
          'ApprovalController:rejectRequest',
          'foo',
          expect.any(Error),
        );

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
          'KeyringController:withKeyring',
          jest.fn().mockImplementation(({ _address }, callback) =>
            callback({
              keyring: {
                exportAccount: jest
                  .fn()
                  .mockResolvedValue(
                    '0000000000000000000000000000000000000000000000000000000000000001',
                  ),
              },
              metadata: {
                id: 'foo',
              },
            }),
          ),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:addNewSecretData',
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
          ),
        ).resolves.toBeUndefined();

        expect(callSpy).toHaveBeenCalledWith(
          'KeyringController:withKeyring',
          { address: '0x123' },
          expect.any(Function),
        );

        expect(callSpy).toHaveBeenCalledWith(
          'SeedlessOnboardingController:addNewSecretData',
          hexToBytes(
            add0x(
              '0000000000000000000000000000000000000000000000000000000000000001',
            ),
          ),
          SecretType.PrivateKey,
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
          'KeyringController:withKeyring',
          jest.fn().mockImplementation(({ _address }, callback) =>
            callback({
              keyring: {
                exportAccount: jest
                  .fn()
                  .mockResolvedValue(
                    '0000000000000000000000000000000000000000000000000000000000000001',
                  ),
              },
              metadata: {
                id: 'foo',
              },
            }),
          ),
        );

        rootMessenger.registerActionHandler(
          'SeedlessOnboardingController:addNewSecretData',
          jest.fn().mockRejectedValue(mockError),
        );

        rootMessenger.registerActionHandler(
          'KeyringController:removeAccount',
          jest.fn(),
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
          'KeyringController:withKeyring',
          jest.fn().mockImplementation(({ _address }, callback) =>
            callback({
              keyring: {
                exportAccount: jest
                  .fn()
                  .mockResolvedValue(
                    '0000000000000000000000000000000000000000000000000000000000000001',
                  ),
              },
              metadata: {
                id: 'foo',
              },
            }),
          ),
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
      const snapKeyring = {
        id: 'foo',
        type: KeyringTypes.snap,
        getAccountsBySnapId: jest.fn().mockReturnValue(['0x123']),
      };

      await withService(async ({ rootMessenger }) => {
        rootMessenger.registerActionHandler(
          'KeyringController:getKeyringsByType',
          jest.fn().mockReturnValue([snapKeyring]),
        );

        const result = await rootMessenger.call(
          'LegacyBackgroundApiService:getAccountsBySnapId',
          'snapId' as SnapId,
        );

        expect(result).toStrictEqual(['0x123']);
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
      'RemoteFeatureFlagController:getState',
      'CurrencyRateController:setCurrentCurrency',
      'AssetsController:setSelectedCurrency',
      'KeyringController:exportSeedPhrase',
      'AccountsController:getSelectedAccount',
      'ApprovalController:getState',
      'TransactionController:getState',
      'ApprovalController:rejectRequest',
      'TransactionController:wipeTransactions',
      'SmartTransactionsController:wipeSmartTransactions',
      'BridgeStatusController:wipeBridgeStatus',
      'NetworkController:resetConnection',
      'KeyringController:importAccountWithStrategy',
      'OnboardingController:getIsSocialLoginFlow',
      'KeyringController:withKeyring',
      'KeyringController:removeAccount',
      'AccountsController:getAccountByAddress',
      'AccountsController:setSelectedAccount',
      'SeedlessOnboardingController:addNewSecretData',
      'SeedlessOnboardingController:updateBackupMetadataState',
      'PermissionController:updatePermissionsByCaveat',
      'KeyringController:getKeyringsByType',
      'KeyringController:addNewKeyring',
      'PreferencesController:setPasswordForgotten',
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
    ...options,
  });
  return await testFunction({ service, rootMessenger, serviceMessenger });
}
