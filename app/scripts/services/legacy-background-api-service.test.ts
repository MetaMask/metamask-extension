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
import { add0x, hexToBytes } from '@metamask/utils';
import {
  EncAccountDataType,
  SecretType,
  RecoveryError,
  SeedlessOnboardingControllerErrorMessage,
} from '@metamask/seedless-onboarding-controller';
import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { SnapId } from '@metamask/snaps-sdk';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { createSentryError } from '../../../shared/lib/error';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS } from '../../../shared/constants/passkey';
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
        rootMessenger.registerActionHandler(
          'MetaMetricsController:trackEvent',
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
      'AccountsController:getAccountByAddress',
      'AccountsController:setSelectedAccount',
      'SeedlessOnboardingController:addNewSecretData',
      'SeedlessOnboardingController:updateBackupMetadataState',
      'PermissionController:updatePermissionsByCaveat',
      'PreferencesController:setPasswordForgotten',
      'OnboardingController:getState',
      'SeedlessOnboardingController:checkIsPasswordOutdated',
      'SeedlessOnboardingController:getState',
      'SeedlessOnboardingController:runMigrations',
      'MetaMetricsController:trackEvent',
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
      'MetaMetricsController:bufferedTrace',
      'MetaMetricsController:bufferedEndTrace',
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
