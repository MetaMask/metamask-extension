/**
 * @jest-environment node
 */
import {
  ListNames,
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  PHISHING_CONFIG_BASE_URL,
  METAMASK_STALELIST_FILE,
  METAMASK_HOTLIST_DIFF_FILE,
} from '@metamask/phishing-controller';
import nock from 'nock';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';
import browser from 'webextension-polyfill';
import mockEncryptor from '../../test/lib/mock-encryptor';
import { HardwareKeyringNames } from '../../shared/constants/hardware-wallets';
import { CHAIN_IDS } from '../../shared/constants/network';
import { toAssetId } from '../../shared/lib/asset-utils';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../shared/lib/environment';
import MetaMaskController from './metamask-controller';
import { convertEnglishWordlistIndicesToCodepoints } from './lib/util';

// Opt out of the global `isAssetsUnifyStateFeatureEnabled` mock (see test/jest/setup.js)
// so unify-state tests can exercise real feature-flag gating via controller state.
jest.mock('../../shared/lib/assets-unify-state/remote-feature-flag', () =>
  jest.requireActual('../../shared/lib/assets-unify-state/remote-feature-flag'),
);

jest.mock('../../shared/lib/environment', () => ({
  ...jest.requireActual('../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(),
}));

jest.mock('./messenger-client-init/perps-controller-init', () => ({
  PerpsControllerInit: jest.fn().mockReturnValue({
    messengerClient: {
      state: {},
      name: 'PerpsController',
    },
    api: {},
  }),
}));

jest.mock('./messenger-client-init/accounts/snap-account-service-init', () => ({
  SnapAccountServiceInit: jest
    .fn()
    .mockImplementation(({ controllerMessenger }) => {
      controllerMessenger.registerActionHandler(
        'SnapAccountService:ensureReady',
        // Never-resolving promise: prevents any Snap provider from proceeding
        // past `ensureReady`, so no Snap accounts get created during init.
        () => new Promise(() => undefined),
      );
      return {
        memStateKey: null,
        persistedStateKey: null,
        messengerClient: {
          init: jest.fn().mockResolvedValue(undefined),
          name: 'SnapAccountService',
        },
      };
    }),
}));

jest.mock('webextension-polyfill', () => ({
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: () => undefined,
    },
    onMessageExternal: {
      addListener: () => undefined,
    },
    getPlatformInfo: async () => 'mac',
  },
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      remove: jest.fn().mockResolvedValue(undefined),
    },
  },
}));

// Use the actual mocked module so all code importing webextension-polyfill
// shares the same mock instance
const browserPolyfillMock = jest.mocked(browser);

const { LocalNodeStub } = require('../../test/stub/local-node');

const localNodeServer = new LocalNodeStub();

let loggerMiddlewareMock;
const initializeMockMiddlewareLog = () => {
  loggerMiddlewareMock = {
    requests: [],
    responses: [],
  };
};
const tearDownMockMiddlewareLog = () => {
  loggerMiddlewareMock = undefined;
};

const createLoggerMiddlewareMock = () => (req, res, next) => {
  if (loggerMiddlewareMock) {
    loggerMiddlewareMock.requests.push(req);
    next((cb) => {
      loggerMiddlewareMock.responses.push(res);
      cb();
    });
    return;
  }
  next();
};
jest.mock('./lib/createLoggerMiddleware', () => createLoggerMiddlewareMock);

const mockULIDs = [
  '01JKAF3DSGM3AB87EM9N0K41AJ',
  '01JKAF3KP7VPAG0YXEDTDRB6ZV',
  '01JKAF3KP7VPAG0YXEDTDRB6ZW',
  '01JKAF3KP7VPAG0YXEDTDRB6ZX',
];

function* ulidGenerator(ulids = mockULIDs) {
  for (const id of ulids) {
    yield id;
  }

  throw new Error('should not be called after exhausting provided IDs');
}

let mockUlidGenerator = ulidGenerator();

jest.mock('ulid', () => ({
  ulid: jest.fn().mockImplementation(() => mockUlidGenerator.next().value),
}));

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('MetaMaskController', function () {
  let metamaskController;
  const noop = () => undefined;

  beforeAll(async function () {
    await localNodeServer.start({ port: 32545 });
  });

  beforeEach(function () {
    nock(PHISHING_CONFIG_BASE_URL)
      .persist()
      .get(METAMASK_STALELIST_FILE)
      .reply(
        200,
        JSON.stringify({
          version: 2,
          tolerance: 2,
          lastUpdated: 1,
          eth_phishing_detect_config: {
            fuzzylist: [],
            allowlist: [],
            blocklist: ['127.0.0.1'],
            name: ListNames.MetaMask,
          },
        }),
      )
      .get(METAMASK_HOTLIST_DIFF_FILE)
      .reply(
        200,
        JSON.stringify([
          { url: '127.0.0.1', targetList: 'blocklist', timestamp: 0 },
        ]),
      );
    nock('https://on-ramp.uat-api.cx.metamask.io')
      .get('/geolocation')
      .reply(200, 'US')
      .persist();
    nock('https://on-ramp.api.cx.metamask.io')
      .get('/geolocation')
      .reply(200, 'US')
      .persist();
    metamaskController = new MetaMaskController({
      showUserConfirmation: noop,
      encryptor: mockEncryptor,
      initLangCode: 'en_US',
      platform: {
        showTransactionNotification: () => undefined,
        getVersion: () => 'foo',
      },
      browser: browserPolyfillMock,
      getRequestAccountTabIds: () => ({}),
      getOpenMetamaskTabsIds: () => ({}),
      notificationManager: {
        markAsAutomaticallyClosed: jest.fn(),
      },
      infuraProjectId: 'foo',
      cronjobControllerStorageManager: {
        init: noop,
        getInitialState: noop,
        set: noop,
      },
      controllerMessenger: new Messenger({
        namespace: MOCK_ANY_NAMESPACE,
        captureException: jest.fn(),
      }),
    });
    initializeMockMiddlewareLog();
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(false);

    // Re-create the ULID generator to start over again the `mockULIDs` list.
    mockUlidGenerator = ulidGenerator();
  });

  afterEach(function () {
    jest.restoreAllMocks();
    nock.cleanAll();
    tearDownMockMiddlewareLog();
  });

  afterAll(async function () {
    await localNodeServer.quit();
  });

  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      // Update the fixture above if this test fails
      expect(METAMASK_STALELIST_URL).toStrictEqual(
        'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
      );
      expect(METAMASK_HOTLIST_DIFF_URL).toStrictEqual(
        'https://phishing-detection.api.cx.metamask.io/v2/diffsSince',
      );
    });
  });

  describe('#createNewVaultAndRestore', function () {
    it('two successive calls with same inputs give same result', async function () {
      await metamaskController.legacyBackgroundApiService.createNewVaultAndRestore(
        'test@123',
        TEST_SEED,
      );
      const result1 = metamaskController.keyringController.state;
      await metamaskController.legacyBackgroundApiService.createNewVaultAndRestore(
        'test@123',
        TEST_SEED,
      );
      const result2 = metamaskController.keyringController.state;

      // v2 Snap keyrings are created lazily per-snap, so a fresh restore
      // produces only the primary HD keyring.
      expect(result1.keyrings).toHaveLength(1);
      expect(result1.keyrings[0].metadata.id).toBe(mockULIDs[0]); // 0: Primary HD keyring

      // On restore, a new keyring metadata is generated.
      const ulidNewIndex = 1;
      expect(result2).toStrictEqual({
        ...result1,
        keyrings: [
          {
            ...result1.keyrings[0],
            metadata: {
              ...result1.keyrings[0].metadata,
              id: mockULIDs[ulidNewIndex], // 0: New primary HD keyring
            },
          },
        ],
      });
    });
  });

  describe('#createNewVaultAndKeychain', function () {
    it('two successive calls with same inputs give same result', async function () {
      await metamaskController.legacyBackgroundApiService.createNewVaultAndKeychain(
        'test@123',
      );
      const result1 = metamaskController.keyringController.state;
      await metamaskController.legacyBackgroundApiService.createNewVaultAndKeychain(
        'test@123',
      );
      const result2 = metamaskController.keyringController.state;
      expect(result1).not.toStrictEqual(undefined);
      expect(result1).toStrictEqual(result2);
    });
  });

  describe('#createNewVaultAndGetSeedPhrase', function () {
    it('creates a vault and returns the seed phrase', async function () {
      const password = 'test@123';
      const encodedSeedPhrase =
        await metamaskController.legacyBackgroundApiService.createNewVaultAndGetSeedPhrase(
          password,
        );
      const seedPhrase = Buffer.from(encodedSeedPhrase).toString('utf8');

      expect(seedPhrase.split(' ')).toHaveLength(12);
      expect(metamaskController.keyringController.state.isUnlocked).toBe(true);
    });
  });

  describe('#unlockAndGetSeedPhrase', function () {
    it('unlocks the vault and returns the seed phrase', async function () {
      const password = 'test@123';
      await metamaskController.legacyBackgroundApiService.createNewVaultAndKeychain(
        password,
      );
      await metamaskController.keyringController.setLocked();

      const encodedSeedPhrase =
        await metamaskController.legacyBackgroundApiService.unlockAndGetSeedPhrase(
          password,
        );
      const seedPhrase = Buffer.from(encodedSeedPhrase).toString('utf8');

      expect(seedPhrase.split(' ')).toHaveLength(12);
      expect(metamaskController.keyringController.state.isUnlocked).toBe(true);
    });
  });

  describe('#addToken', function () {
    const address = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const symbol = 'LINK';
    const decimals = 18;
    const networkClientId = 'sepolia';

    it('delegates to TokensController.addToken when assets-unify state is off', async function () {
      const addTokenSpy = jest
        .spyOn(metamaskController.tokensController, 'addToken')
        .mockResolvedValue(undefined);

      await metamaskController.getApi().addToken({
        address,
        symbol,
        decimals,
        networkClientId,
      });

      expect(addTokenSpy).toHaveBeenCalledWith({
        address,
        symbol,
        decimals,
        image: undefined,
        networkClientId,
      });
    });

    it('two parallel calls with same token details give same result', async function () {
      const [token1, token2] = await Promise.all([
        metamaskController
          .getApi()
          .addToken({ address, symbol, decimals, networkClientId: 'sepolia' }),
        metamaskController
          .getApi()
          .addToken({ address, symbol, decimals, networkClientId: 'sepolia' }),
      ]);
      expect(token1).toStrictEqual(token2);
    });

    it('networkClientId is used when provided', async function () {
      const callSpy = jest
        .spyOn(metamaskController.tokensController.messenger, 'call')
        .mockReturnValueOnce({
          configuration: { chainId: '0xa' },
        })
        .mockReturnValueOnce({
          configuration: { chainId: '0xa' },
        })
        .mockReturnValueOnce({
          networkConfigurationsByChainId: {
            '0xa': {
              nativeCurrency: 'ETH',
              chainId: '0xa',
            },
          },
        });

      await metamaskController.getApi().addToken({
        address,
        symbol,
        decimals,
        networkClientId: 'networkClientId1',
      });
      expect(callSpy.mock.calls[0]).toStrictEqual([
        'NetworkController:getNetworkClientById',
        'networkClientId1',
      ]);
    });

    describe('with assets-unify state enabled', function () {
      let unifyController;

      beforeEach(function () {
        jest
          .mocked(getIsAssetsUnifiedStateIncludedInBuild)
          .mockReturnValue(true);

        unifyController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initLangCode: 'en_US',
          initState: {
            RemoteFeatureFlagController: {
              remoteFeatureFlags: {
                assetsUnifyState: {
                  enabled: true,
                  featureVersion: '1',
                  minimumVersion: null,
                },
              },
            },
          },
          platform: {
            showTransactionNotification: () => undefined,
            getVersion: () => 'foo',
          },
          browser: browserPolyfillMock,
          getRequestAccountTabIds: () => ({}),
          getOpenMetamaskTabsIds: () => ({}),
          notificationManager: {
            markAsAutomaticallyClosed: jest.fn(),
          },
          infuraProjectId: 'foo',
          cronjobControllerStorageManager: {
            init: noop,
            getInitialState: noop,
            set: noop,
          },
          controllerMessenger: new Messenger({
            namespace: MOCK_ANY_NAMESPACE,
            captureException: jest.fn(),
          }),
        });

        jest
          .spyOn(unifyController.accountsController, 'getSelectedAccount')
          .mockReturnValue({ id: 'test-account-id' });
        jest
          .spyOn(unifyController.networkController, 'getNetworkClientById')
          .mockReturnValue({
            configuration: { chainId: CHAIN_IDS.SEPOLIA },
          });
        jest
          .spyOn(unifyController.assetsController, 'addCustomAsset')
          .mockResolvedValue(undefined);
        jest
          .spyOn(unifyController.tokensController, 'addToken')
          .mockResolvedValue(undefined);
      });

      it('adds token via AssetsController.addCustomAsset', async function () {
        const image = 'https://example.com/icon.png';
        const expectedAssetId = toAssetId(address, CHAIN_IDS.SEPOLIA);

        await unifyController.getApi().addToken({
          address,
          symbol,
          decimals,
          image,
          networkClientId,
        });

        expect(
          unifyController.tokensController.addToken,
        ).not.toHaveBeenCalled();
        expect(
          unifyController.assetsController.addCustomAsset,
        ).toHaveBeenCalledWith('test-account-id', expectedAssetId, {
          address,
          symbol,
          name: symbol,
          decimals,
          chainId: CHAIN_IDS.SEPOLIA,
          iconUrl: image,
        });
      });

      it('omits iconUrl when image is not provided', async function () {
        const expectedAssetId = toAssetId(address, CHAIN_IDS.SEPOLIA);

        await unifyController.getApi().addToken({
          address,
          symbol,
          decimals,
          networkClientId,
        });

        expect(
          unifyController.assetsController.addCustomAsset,
        ).toHaveBeenCalledWith('test-account-id', expectedAssetId, {
          address,
          symbol,
          name: symbol,
          decimals,
          chainId: CHAIN_IDS.SEPOLIA,
        });
      });

      it('throws when assetId cannot be built', async function () {
        unifyController.networkController.getNetworkClientById.mockReturnValue({
          configuration: {},
        });

        await expect(
          unifyController.getApi().addToken({
            address,
            symbol,
            decimals,
            networkClientId,
          }),
        ).rejects.toThrow(
          `MetaMask - Cannot build assetId for token ${address} on undefined`,
        );

        expect(
          unifyController.assetsController.addCustomAsset,
        ).not.toHaveBeenCalled();
      });
    });
  });

  describe('#approveHardwareWalletTransaction', function () {
    it('should delegate to resolvePendingApproval with transaction payload and hardware wallet options', async function () {
      const resolvePendingApprovalSpy = jest
        .spyOn(
          metamaskController.legacyBackgroundApiService,
          'resolvePendingApproval',
        )
        .mockResolvedValue();
      const txMeta = {
        id: '42',
        txParams: {
          from: '0x0000000000000000000000000000000000000001',
          to: '0x0000000000000000000000000000000000000002',
        },
      };
      const actionId = mockULIDs[3];

      await metamaskController.legacyBackgroundApiService.approveHardwareWalletTransaction(
        {
          txId: 42,
          txMeta,
          actionId,
          walletType: HardwareKeyringNames.ledger,
        },
      );

      expect(resolvePendingApprovalSpy).toHaveBeenCalledWith(
        '42',
        { txMeta, actionId },
        { waitForResult: true, walletType: HardwareKeyringNames.ledger },
      );
    });
  });

  describe('passkey methods', function () {
    const registrationResponse = { id: 'credential-id' };
    const authenticationResponse = { id: 'assertion-id' };

    describe('#generatePasskeyRegistrationOptions', function () {
      it('delegates to passkey controller with prf availability', async function () {
        const generateRegistrationOptionsSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'generateRegistrationOptions',
          )
          .mockResolvedValue({ challenge: 'challenge' });

        const result = await metamaskController
          .getApi()
          .generatePasskeyRegistrationOptions({
            prfAvailable: true,
          });

        expect(generateRegistrationOptionsSpy).toHaveBeenCalledWith({
          prfAvailable: true,
        });
        expect(result).toStrictEqual({ challenge: 'challenge' });
      });
    });

    describe('#generatePasskeyAuthenticationOptions', function () {
      it('delegates to passkey controller', async function () {
        const generateAuthenticationOptionsSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'generateAuthenticationOptions',
          )
          .mockResolvedValue({ challenge: 'challenge' });

        const result = await metamaskController
          .getApi()
          .generatePasskeyAuthenticationOptions();

        expect(generateAuthenticationOptionsSpy).toHaveBeenCalledTimes(1);
        expect(result).toStrictEqual({ challenge: 'challenge' });
      });
    });

    describe('#generatePasskeyPostRegistrationAuthenticationOptions', function () {
      it('delegates to passkey controller', async function () {
        const spy = jest
          .spyOn(
            metamaskController.passkeyController,
            'generatePostRegistrationAuthenticationOptions',
          )
          .mockReturnValue({ challenge: 'post-reg' });

        const result = await metamaskController
          .getApi()
          .generatePasskeyPostRegistrationAuthenticationOptions(
            registrationResponse,
          );

        expect(spy).toHaveBeenCalledWith({ registrationResponse });
        expect(result).toStrictEqual({ challenge: 'post-reg' });
      });
    });

    describe('#protectVaultKeyWithPasskey', function () {
      it('delegates to the passkey controller action with reshaped params', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController.getApi().protectVaultKeyWithPasskey({
          registrationResponse,
          authenticationResponse,
          password: 'password',
        });

        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:protectVaultKeyWithPasskey',
          {
            registrationResponse,
            authenticationResponse,
            password: 'password',
          },
        );
      });

      it('forwards an undefined password before onboarding completion', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController.getApi().protectVaultKeyWithPasskey({
          registrationResponse,
          authenticationResponse,
          password: undefined,
        });

        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:protectVaultKeyWithPasskey',
          {
            registrationResponse,
            authenticationResponse,
            password: undefined,
          },
        );
      });
    });

    describe('#unlockWithPasskey', function () {
      it('delegates to the legacy background API service unlock action', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController
          .getApi()
          .unlockWithPasskey(authenticationResponse);

        expect(callSpy).toHaveBeenCalledWith(
          'LegacyBackgroundApiService:unlockWithPasskey',
          authenticationResponse,
        );
      });
    });

    describe('#removePasskeyWithPasskeyVerification', function () {
      it('delegates to the passkey controller', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController
          .getApi()
          .removePasskeyWithPasskeyVerification(authenticationResponse);

        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:removePasskeyWithPasskeyVerification',
          authenticationResponse,
        );
      });
    });

    describe('#removePasskeyWithPasswordVerification', function () {
      it('delegates to the passkey controller', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController
          .getApi()
          .removePasskeyWithPasswordVerification('password');

        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:removePasskeyWithPasswordVerification',
          'password',
        );
      });
    });

    describe('#changePasswordWithPasskeyVerification', function () {
      it('delegates to the legacy background API service action which serializes the change', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController
          .getApi()
          .changePasswordWithPasskeyVerification({
            newPassword: 'new-password',
            authenticationResponse,
            options: undefined,
          });

        expect(callSpy).toHaveBeenCalledWith(
          'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
          {
            newPassword: 'new-password',
            authenticationResponse,
            options: undefined,
          },
        );
      });

      it('forwards the renewVaultKeyProtection option', async function () {
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue(undefined);

        await metamaskController
          .getApi()
          .changePasswordWithPasskeyVerification({
            newPassword: 'new-password',
            authenticationResponse,
            options: { renewVaultKeyProtection: false },
          });

        expect(callSpy).toHaveBeenCalledWith(
          'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
          {
            newPassword: 'new-password',
            authenticationResponse,
            options: { renewVaultKeyProtection: false },
          },
        );
      });
    });

    describe('#exportSeedPhraseWithPasskey', function () {
      it('delegates to the passkey controller and re-encodes the result', async function () {
        const mnemonic = new Uint8Array([0, 0, 0, 1]);
        const exportSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'exportSeedPhraseWithPasskey',
          )
          .mockResolvedValue(mnemonic);

        const result = await metamaskController.exportSeedPhraseWithPasskey(
          authenticationResponse,
          'keyring-id',
        );

        expect(exportSpy).toHaveBeenCalledWith(
          authenticationResponse,
          'keyring-id',
        );
        expect(result).toStrictEqual(
          convertEnglishWordlistIndicesToCodepoints(mnemonic),
        );
      });

      it('defaults to the primary keyring when no keyring id is provided', async function () {
        const exportSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'exportSeedPhraseWithPasskey',
          )
          .mockResolvedValue(new Uint8Array([0, 0, 0, 1]));

        await metamaskController.exportSeedPhraseWithPasskey(
          authenticationResponse,
        );

        expect(exportSpy).toHaveBeenCalledWith(
          authenticationResponse,
          undefined,
        );
      });

      it('propagates errors from the passkey controller', async function () {
        jest
          .spyOn(
            metamaskController.passkeyController,
            'exportSeedPhraseWithPasskey',
          )
          .mockRejectedValue(new Error('invalid assertion'));

        await expect(
          metamaskController.exportSeedPhraseWithPasskey(
            authenticationResponse,
          ),
        ).rejects.toThrow('invalid assertion');
      });
    });

    describe('#exportAccountsWithPasskey', function () {
      it('delegates to the passkey controller action and returns its result', async function () {
        const addresses = ['0xAddressOne', '0xAddressTwo'];
        const callSpy = jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockResolvedValue([
            'priv-key-0xAddressOne',
            'priv-key-0xAddressTwo',
          ]);

        const result = await metamaskController
          .getApi()
          .exportAccountsWithPasskey(authenticationResponse, addresses);

        expect(callSpy).toHaveBeenCalledWith(
          'PasskeyController:exportAccountsWithPasskey',
          authenticationResponse,
          addresses,
        );
        expect(result).toStrictEqual([
          'priv-key-0xAddressOne',
          'priv-key-0xAddressTwo',
        ]);
      });

      it('propagates errors from the passkey controller', async function () {
        jest
          .spyOn(metamaskController.controllerMessenger, 'call')
          .mockRejectedValue(new Error('invalid assertion'));

        await expect(
          metamaskController
            .getApi()
            .exportAccountsWithPasskey(authenticationResponse, [
              '0xAddressOne',
            ]),
        ).rejects.toThrow('invalid assertion');
      });
    });

    describe('#getApi', function () {
      it('exposes passkey api methods', function () {
        const api = metamaskController.getApi();

        expect(api).toStrictEqual(
          expect.objectContaining({
            generatePasskeyRegistrationOptions: expect.any(Function),
            generatePasskeyPostRegistrationAuthenticationOptions:
              expect.any(Function),
            generatePasskeyAuthenticationOptions: expect.any(Function),
            protectVaultKeyWithPasskey: expect.any(Function),
            unlockWithPasskey: expect.any(Function),
            removePasskeyWithPasskeyVerification: expect.any(Function),
            removePasskeyWithPasswordVerification: expect.any(Function),
            changePasswordWithPasskeyVerification: expect.any(Function),
            exportSeedPhraseWithPasskey: expect.any(Function),
            exportAccountsWithPasskey: expect.any(Function),
          }),
        );
      });
    });
  });
});
