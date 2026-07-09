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
import { ApprovalRequestNotFoundError } from '@metamask/approval-controller';
import nock from 'nock';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';
import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';
import browser from 'webextension-polyfill';
import mockEncryptor from '../../test/lib/mock-encryptor';
import { HardwareKeyringNames } from '../../shared/constants/hardware-wallets';
import { ExtensionPasskeyErrorCode } from '../../shared/lib/passkey/passkey-error';
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

const mockToHardwareWalletError = jest.fn();
const mockIsUserRejectedHardwareWalletError = jest.fn().mockReturnValue(false);

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

jest.mock('../../ui/contexts/hardware-wallets', () => ({
  toHardwareWalletError: (...args) => mockToHardwareWalletError(...args),
  isUserRejectedHardwareWalletError: (...args) =>
    mockIsUserRejectedHardwareWalletError(...args),
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
    mockToHardwareWalletError.mockReset();
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
      await metamaskController.createNewVaultAndRestore('test@123', TEST_SEED);
      const result1 = metamaskController.keyringController.state;
      await metamaskController.createNewVaultAndRestore('test@123', TEST_SEED);
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
      await metamaskController.createNewVaultAndKeychain('test@123');
      const result1 = metamaskController.keyringController.state;
      await metamaskController.createNewVaultAndKeychain('test@123');
      const result2 = metamaskController.keyringController.state;
      expect(result1).not.toStrictEqual(undefined);
      expect(result1).toStrictEqual(result2);
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

  describe('#resolvePendingApproval', function () {
    it('should not propagate ApprovalRequestNotFoundError', async function () {
      const error = new ApprovalRequestNotFoundError('123');
      metamaskController.approvalController = {
        acceptRequest: () => {
          throw error;
        },
      };
      await expect(
        metamaskController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
      ).resolves.not.toThrow(error);
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', async function () {
      const error = new Error();
      metamaskController.approvalController = {
        acceptRequest: () => {
          throw error;
        },
      };
      await expect(
        metamaskController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
      ).rejects.toThrow(error);
    });

    it('should normalize null options before calling approvalController.acceptRequest', async function () {
      const approvalId = mockULIDs[0];
      const approvalValue = { txMeta: { id: '0x1' } };
      metamaskController.approvalController = {
        acceptRequest: jest.fn().mockResolvedValue(undefined),
      };

      await metamaskController.resolvePendingApproval(
        approvalId,
        approvalValue,
        null,
      );

      expect(
        metamaskController.approvalController.acceptRequest,
      ).toHaveBeenCalledWith(approvalId, approvalValue, undefined);
    });

    it('should pass only waitForResult to approvalController.acceptRequest options', async function () {
      const approvalId = mockULIDs[1];
      const approvalValue = { txMeta: { id: '0x2' } };
      metamaskController.approvalController = {
        acceptRequest: jest.fn().mockResolvedValue(undefined),
      };

      await metamaskController.resolvePendingApproval(
        approvalId,
        approvalValue,
        {
          waitForResult: true,
          walletType: HardwareKeyringNames.ledger,
        },
      );

      expect(
        metamaskController.approvalController.acceptRequest,
      ).toHaveBeenCalledWith(approvalId, approvalValue, {
        waitForResult: true,
      });
    });

    it('should transform hardware wallet errors to internal JSON-RPC errors', async function () {
      const approvalId = mockULIDs[2];
      const approvalValue = { txMeta: { id: '0x3' } };
      const error = new Error('Ledger transport disconnected');
      metamaskController.approvalController = {
        acceptRequest: () => {
          throw error;
        },
      };
      mockToHardwareWalletError.mockReturnValue({
        message: 'Device disconnected',
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'Please reconnect your device',
        metadata: {
          transport: 'usb',
          walletType: HardwareKeyringNames.ledger,
        },
      });

      await expect(
        metamaskController.resolvePendingApproval(approvalId, approvalValue, {
          walletType: HardwareKeyringNames.ledger,
        }),
      ).rejects.toMatchObject({
        code: -32603,
        data: {
          code: ErrorCode.DeviceDisconnected,
          severity: Severity.Err,
          category: Category.Connection,
          userMessage: 'Please reconnect your device',
          metadata: {
            transport: 'usb',
            walletType: HardwareKeyringNames.ledger,
          },
        },
      });

      expect(mockToHardwareWalletError).toHaveBeenCalledWith(
        error,
        HardwareKeyringNames.ledger,
      );
    });
  });

  describe('#approveHardwareWalletTransaction', function () {
    it('should delegate to resolvePendingApproval with transaction payload and hardware wallet options', async function () {
      const resolvePendingApprovalSpy = jest
        .spyOn(metamaskController, 'resolvePendingApproval')
        .mockResolvedValue();
      const txMeta = {
        id: '42',
        txParams: {
          from: '0x0000000000000000000000000000000000000001',
          to: '0x0000000000000000000000000000000000000002',
        },
      };
      const actionId = mockULIDs[3];

      await metamaskController.approveHardwareWalletTransaction({
        txId: 42,
        txMeta,
        actionId,
        walletType: HardwareKeyringNames.ledger,
      });

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
      it('requires password when onboarding is complete', async function () {
        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({
            ...metamaskController.onboardingController.state,
            completedOnboarding: true,
          });

        await expect(
          metamaskController.protectVaultKeyWithPasskey(
            registrationResponse,
            authenticationResponse,
          ),
        ).rejects.toThrow('Password required to register passkey');
      });

      it('verifies password and protects vault key after onboarding', async function () {
        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({
            ...metamaskController.onboardingController.state,
            completedOnboarding: true,
          });
        const verifyPasswordSpy = jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockResolvedValue(true);
        jest
          .spyOn(metamaskController.keyringController, 'exportEncryptionKey')
          .mockResolvedValue('vault-key');
        const protectVaultKeySpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'protectVaultKeyWithPasskey',
          )
          .mockResolvedValue();

        await metamaskController.protectVaultKeyWithPasskey(
          registrationResponse,
          authenticationResponse,
          'password',
        );

        expect(verifyPasswordSpy).toHaveBeenCalledWith('password');
        expect(protectVaultKeySpy).toHaveBeenCalledWith({
          registrationResponse,
          authenticationResponse,
          vaultKey: 'vault-key',
        });
      });

      it('skips password verification before onboarding completion', async function () {
        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({
            ...metamaskController.onboardingController.state,
            completedOnboarding: false,
          });
        const verifyPasswordSpy = jest.spyOn(
          metamaskController.keyringController,
          'verifyPassword',
        );
        jest
          .spyOn(metamaskController.keyringController, 'exportEncryptionKey')
          .mockResolvedValue('vault-key');
        const protectVaultKeySpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'protectVaultKeyWithPasskey',
          )
          .mockResolvedValue();

        await metamaskController.protectVaultKeyWithPasskey(
          registrationResponse,
          authenticationResponse,
        );

        expect(verifyPasswordSpy).not.toHaveBeenCalled();
        expect(protectVaultKeySpy).toHaveBeenCalledWith({
          registrationResponse,
          authenticationResponse,
          vaultKey: 'vault-key',
        });
      });
    });

    describe('#unlockWithPasskey', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);

        await expect(
          metamaskController.unlockWithPasskey(authenticationResponse),
        ).rejects.toMatchObject({
          name: 'PasskeyControllerError',
          code: PasskeyControllerErrorCode.NotEnrolled,
        });
      });

      it('retrieves vault key and submits encryption key', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        const retrieveVaultKeySpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('vault-key');
        const submitEncryptionKeySpy = jest
          .spyOn(metamaskController, 'submitEncryptionKey')
          .mockResolvedValue();

        await metamaskController.unlockWithPasskey(authenticationResponse);

        expect(retrieveVaultKeySpy).toHaveBeenCalledWith(
          authenticationResponse,
        );
        expect(submitEncryptionKeySpy).toHaveBeenCalledWith('vault-key');
      });
    });

    describe('#removePasskeyWithPasskeyVerification', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);

        await expect(
          metamaskController.removePasskeyWithPasskeyVerification(
            authenticationResponse,
          ),
        ).rejects.toMatchObject({
          name: 'PasskeyControllerError',
          code: PasskeyControllerErrorCode.NotEnrolled,
        });
      });

      it('throws when passkey authentication verification fails', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(false);

        await expect(
          metamaskController.removePasskeyWithPasskeyVerification(
            authenticationResponse,
          ),
        ).rejects.toThrow('Passkey authentication verification failed');
      });

      it('removes passkey after successful verification', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        const verifyPasskeyAuthenticationSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(true);
        const removePasskeySpy = jest
          .spyOn(metamaskController.passkeyController, 'removePasskey')
          .mockReturnValue();

        await metamaskController.removePasskeyWithPasskeyVerification(
          authenticationResponse,
        );

        expect(verifyPasskeyAuthenticationSpy).toHaveBeenCalledWith(
          authenticationResponse,
        );
        expect(removePasskeySpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('#removePasskeyWithPasswordVerification', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);
        const verifyPasswordSpy = jest.spyOn(
          metamaskController.keyringController,
          'verifyPassword',
        );

        await expect(
          metamaskController.removePasskeyWithPasswordVerification('password'),
        ).rejects.toMatchObject({
          name: 'PasskeyControllerError',
          code: PasskeyControllerErrorCode.NotEnrolled,
        });

        expect(verifyPasswordSpy).not.toHaveBeenCalled();
      });

      it('verifies password then removes passkey', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        const verifyPasswordSpy = jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockResolvedValue(true);
        const removePasskeySpy = jest
          .spyOn(metamaskController.passkeyController, 'removePasskey')
          .mockReturnValue();

        await metamaskController.removePasskeyWithPasswordVerification(
          'password',
        );

        expect(verifyPasswordSpy).toHaveBeenCalledWith('password');
        expect(removePasskeySpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('#changePasswordWithPasskeyVerification', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);

        await expect(
          metamaskController.changePasswordWithPasskeyVerification(
            'new-password',
            authenticationResponse,
          ),
        ).rejects.toMatchObject({
          name: 'PasskeyControllerError',
          code: PasskeyControllerErrorCode.NotEnrolled,
        });
      });

      it('throws when passkey authentication verification fails', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(false);

        await expect(
          metamaskController.changePasswordWithPasskeyVerification(
            'new-password',
            authenticationResponse,
          ),
        ).rejects.toThrow('Passkey authentication verification failed');
      });

      it('changes password and renews vault key protection', async function () {
        const releaseLock = jest.fn();
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(true);
        jest
          .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
          .mockResolvedValue(releaseLock);
        jest
          .spyOn(metamaskController.keyringController, 'exportEncryptionKey')
          .mockResolvedValueOnce('old-vault-key')
          .mockResolvedValueOnce('new-vault-key');
        const changePasswordSpy = jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        const renewVaultKeyProtectionSpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'renewVaultKeyProtection',
          )
          .mockResolvedValue();

        await metamaskController.changePasswordWithPasskeyVerification(
          'new-password',
          authenticationResponse,
        );

        expect(changePasswordSpy).toHaveBeenCalledWith('new-password');
        expect(renewVaultKeyProtectionSpy).toHaveBeenCalledWith({
          authenticationResponse,
          oldVaultKey: 'old-vault-key',
          newVaultKey: 'new-vault-key',
        });
        expect(releaseLock).toHaveBeenCalledTimes(1);
      });

      it('removes passkey and rethrows when renew protection fails', async function () {
        const releaseLock = jest.fn();
        const renewError = new Error('renew failed');
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(true);
        jest
          .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
          .mockResolvedValue(releaseLock);
        jest
          .spyOn(metamaskController.keyringController, 'exportEncryptionKey')
          .mockResolvedValueOnce('old-vault-key')
          .mockResolvedValueOnce('new-vault-key');
        jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.passkeyController,
            'renewVaultKeyProtection',
          )
          .mockRejectedValue(renewError);
        const removePasskeySpy = jest
          .spyOn(metamaskController.passkeyController, 'removePasskey')
          .mockReturnValue();

        await expect(
          metamaskController.changePasswordWithPasskeyVerification(
            'new-password',
            authenticationResponse,
          ),
        ).rejects.toMatchObject({
          name: 'PasskeyControllerError',
          message:
            'Passkey vault key protection renewal failed after password change',
          code: ExtensionPasskeyErrorCode.VaultKeyRenewalFailed,
          cause: renewError,
        });

        expect(removePasskeySpy).toHaveBeenCalledTimes(1);
        expect(releaseLock).toHaveBeenCalledTimes(1);
      });

      it('releases lock and rethrows when keyring password change fails', async function () {
        const releaseLock = jest.fn();
        const changePasswordError = new Error('change password failed');
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(true);
        jest
          .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
          .mockResolvedValue(releaseLock);
        jest
          .spyOn(metamaskController.keyringController, 'exportEncryptionKey')
          .mockResolvedValue('old-vault-key');
        jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockRejectedValue(changePasswordError);
        const renewVaultKeyProtectionSpy = jest.spyOn(
          metamaskController.passkeyController,
          'renewVaultKeyProtection',
        );

        await expect(
          metamaskController.changePasswordWithPasskeyVerification(
            'new-password',
            authenticationResponse,
          ),
        ).rejects.toThrow(changePasswordError);

        expect(renewVaultKeyProtectionSpy).not.toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalledTimes(1);
      });

      it('changes password and removes passkey when vault key protection renewal is skipped', async function () {
        const releaseLock = jest.fn();
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'verifyPasskeyAuthentication',
          )
          .mockResolvedValue(true);
        jest
          .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
          .mockResolvedValue(releaseLock);
        const changePasswordSpy = jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        const verifyPasswordSpy = jest.spyOn(
          metamaskController.keyringController,
          'verifyPassword',
        );
        const renewVaultKeyProtectionSpy = jest.spyOn(
          metamaskController.passkeyController,
          'renewVaultKeyProtection',
        );
        const removePasskeySpy = jest
          .spyOn(metamaskController.passkeyController, 'removePasskey')
          .mockReturnValue();

        await metamaskController.changePasswordWithPasskeyVerification(
          'new-password',
          authenticationResponse,
          { renewVaultKeyProtection: false },
        );

        expect(changePasswordSpy).toHaveBeenCalledWith('new-password');
        expect(verifyPasswordSpy).not.toHaveBeenCalled();
        expect(removePasskeySpy).toHaveBeenCalledTimes(1);
        expect(renewVaultKeyProtectionSpy).not.toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalledTimes(1);
      });
    });

    describe('#exportSeedPhraseWithPasskey', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);

        await expect(
          metamaskController.exportSeedPhraseWithPasskey(
            authenticationResponse,
          ),
        ).rejects.toMatchObject({
          code: PasskeyControllerErrorCode.NotEnrolled,
        });
      });

      it('propagates the error when passkey verification fails', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockRejectedValue(new Error('invalid assertion'));

        await expect(
          metamaskController.exportSeedPhraseWithPasskey(
            authenticationResponse,
          ),
        ).rejects.toThrow('invalid assertion');
      });

      it('throws when the passkey vault key cannot decrypt the vault', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('passkey-vault-key');
        jest
          .spyOn(metamaskController.keyringController, 'exportSeedPhrase')
          .mockRejectedValue(new Error('Incorrect encryption key'));

        await expect(
          metamaskController.exportSeedPhraseWithPasskey(
            authenticationResponse,
          ),
        ).rejects.toThrow('Incorrect encryption key');
      });

      it('returns the encoded seed phrase for the given keyring after verification', async function () {
        const mnemonic = new Uint8Array([0, 0, 0, 1]);
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('vault-key');
        const exportSeedPhraseSpy = jest
          .spyOn(metamaskController.keyringController, 'exportSeedPhrase')
          .mockResolvedValue(mnemonic);

        const result = await metamaskController.exportSeedPhraseWithPasskey(
          authenticationResponse,
          'keyring-id',
        );

        expect(exportSeedPhraseSpy).toHaveBeenCalledWith(
          { encryptionKey: 'vault-key' },
          'keyring-id',
        );
        expect(result).toStrictEqual(
          convertEnglishWordlistIndicesToCodepoints(mnemonic),
        );
      });

      it('defaults to the primary keyring when no keyring id is provided', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('vault-key');
        const exportSeedPhraseSpy = jest
          .spyOn(metamaskController.keyringController, 'exportSeedPhrase')
          .mockResolvedValue(new Uint8Array([0, 0, 0, 1]));

        await metamaskController.exportSeedPhraseWithPasskey(
          authenticationResponse,
        );

        expect(exportSeedPhraseSpy).toHaveBeenCalledWith(
          { encryptionKey: 'vault-key' },
          undefined,
        );
      });
    });

    describe('#exportAccountsWithPasskey', function () {
      it('throws when passkey is not registered', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(false);

        await expect(
          metamaskController.exportAccountsWithPasskey(authenticationResponse, [
            '0xAddressOne',
          ]),
        ).rejects.toMatchObject({
          code: PasskeyControllerErrorCode.NotEnrolled,
        });
      });

      it('propagates the error when passkey verification fails', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockRejectedValue(new Error('invalid assertion'));

        await expect(
          metamaskController.exportAccountsWithPasskey(authenticationResponse, [
            '0xAddressOne',
          ]),
        ).rejects.toThrow('invalid assertion');
      });

      it('propagates the error when account export fails', async function () {
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('passkey-vault-key');
        jest
          .spyOn(metamaskController.keyringController, 'exportAccount')
          .mockRejectedValue(new Error('Incorrect encryption key'));

        await expect(
          metamaskController.exportAccountsWithPasskey(authenticationResponse, [
            '0xAddressOne',
          ]),
        ).rejects.toThrow('Incorrect encryption key');
      });

      it('returns private keys for each address after verification', async function () {
        const addresses = ['0xAddressOne', '0xAddressTwo'];
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        const retrieveVaultKeyWithPasskeySpy = jest
          .spyOn(
            metamaskController.passkeyController,
            'retrieveVaultKeyWithPasskey',
          )
          .mockResolvedValue('vault-key');
        const exportAccountSpy = jest
          .spyOn(metamaskController.keyringController, 'exportAccount')
          .mockImplementation((_options, address) =>
            Promise.resolve(`priv-key-${address}`),
          );

        const result = await metamaskController.exportAccountsWithPasskey(
          authenticationResponse,
          addresses,
        );

        expect(retrieveVaultKeyWithPasskeySpy).toHaveBeenCalledWith(
          authenticationResponse,
        );
        expect(retrieveVaultKeyWithPasskeySpy).toHaveBeenCalledTimes(1);
        expect(exportAccountSpy).toHaveBeenCalledTimes(2);
        expect(exportAccountSpy).toHaveBeenCalledWith(
          { encryptionKey: 'vault-key' },
          '0xAddressOne',
        );
        expect(exportAccountSpy).toHaveBeenCalledWith(
          { encryptionKey: 'vault-key' },
          '0xAddressTwo',
        );
        expect(result).toStrictEqual([
          'priv-key-0xAddressOne',
          'priv-key-0xAddressTwo',
        ]);
      });
    });

    describe('#resetWallet', function () {
      it('clears passkey controller state as part of reset flow', async function () {
        const clearPasskeyStateSpy = jest
          .spyOn(metamaskController.passkeyController, 'clearState')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.keyringController, 'setLocked')
          .mockResolvedValue();
        jest
          .spyOn(metamaskController, 'clearLoginArtifacts')
          .mockResolvedValue();
        await metamaskController.resetWallet(true);

        expect(clearPasskeyStateSpy).toHaveBeenCalledTimes(1);
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
