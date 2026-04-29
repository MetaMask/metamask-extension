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
import { PermissionsRequestNotFoundError } from '@metamask/permission-controller';
import nock from 'nock';
import {
  RecoveryError,
  SeedlessOnboardingControllerErrorMessage,
} from '@metamask/seedless-onboarding-controller';
import { PasskeyControllerErrorCode } from '@metamask/passkey-controller';
import { MOCK_ANY_NAMESPACE, Messenger } from '@metamask/messenger';
import { Category, ErrorCode, Severity } from '@metamask/hw-wallet-sdk';
import browser from 'webextension-polyfill';
import mockEncryptor from '../../test/lib/mock-encryptor';
import { HardwareKeyringNames } from '../../shared/constants/hardware-wallets';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import MetaMaskController from './metamask-controller';

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

const { Ganache } = require('../../test/e2e/seeder/ganache');

const ganacheServer = new Ganache();

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
    await ganacheServer.start({ port: 32545 });
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

    // Re-create the ULID generator to start over again the `mockULIDs` list.
    mockUlidGenerator = ulidGenerator();
  });

  afterEach(function () {
    jest.restoreAllMocks();
    nock.cleanAll();
    tearDownMockMiddlewareLog();
  });

  afterAll(async function () {
    await ganacheServer.quit();
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

  describe('#addNewAccount', function () {
    it('two parallel calls with same accountCount give same result', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const [addNewAccountResult1, addNewAccountResult2] = await Promise.all([
        metamaskController.addNewAccount(1),
        metamaskController.addNewAccount(1),
      ]);
      expect(addNewAccountResult1).toStrictEqual(addNewAccountResult2);
    });

    it('two successive calls with same accountCount give same result', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(1);
      expect(addNewAccountResult1).toStrictEqual(addNewAccountResult2);
    });

    it('two successive calls with different accountCount give different results', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(2);
      expect(addNewAccountResult1).not.toStrictEqual(addNewAccountResult2);
    });
  });

  describe('#importAccountWithStrategy', function () {
    it('throws an error when importing the same account twice', async function () {
      const importPrivkey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';
      await metamaskController.createNewVaultAndKeychain('test@123');

      await metamaskController.importAccountWithStrategy('privateKey', [
        importPrivkey,
      ]);

      await expect(
        metamaskController.importAccountWithStrategy('privateKey', [
          importPrivkey,
        ]),
      ).rejects.toThrow(
        'KeyringController - The account you are trying to import is a duplicate',
      );
    });
  });

  describe('#createNewVaultAndRestore', function () {
    it('two successive calls with same inputs give same result', async function () {
      await metamaskController.createNewVaultAndRestore('test@123', TEST_SEED);
      const result1 = metamaskController.keyringController.state;
      await metamaskController.createNewVaultAndRestore('test@123', TEST_SEED);
      const result2 = metamaskController.keyringController.state;

      expect(result1.keyrings).toHaveLength(2);
      expect(result1.keyrings[0].metadata.id).toBe(mockULIDs[0]); // 0: Primary HD keyring
      expect(result1.keyrings[1].metadata.id).toBe(mockULIDs[1]); // 1: Snap keyring

      // On restore, a new keyring metadata is generated.
      const ulidNewIndex = 2;
      expect(result2).toStrictEqual({
        ...result1,
        keyrings: [
          {
            ...result1.keyrings[0],
            metadata: {
              ...result1.keyrings[0].metadata,
              id: mockULIDs[ulidNewIndex + 0], // 0: New primary HD keyring
            },
          },
          {
            ...result1.keyrings[1],
            metadata: {
              ...result1.keyrings[1].metadata,
              id: mockULIDs[ulidNewIndex + 1], // 1: New Snap keyring
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

  describe('#setLocked', function () {
    it('should lock the wallet', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');

      await metamaskController.setLocked();

      expect(
        metamaskController.keyringController.state.isUnlocked,
      ).toStrictEqual(false);
      expect(metamaskController.keyringController.state.keyrings).toStrictEqual(
        [],
      );
    });

    it('should acquire the seedlessOperationMutex when social login flow is enabled', async function () {
      jest
        .spyOn(metamaskController.onboardingController, 'getIsSocialLoginFlow')
        .mockReturnValue(true);
      const mockReleaseLock = jest.fn();
      const acquireSpy = jest
        .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
        .mockResolvedValue(mockReleaseLock);
      const seedlessSetLockedSpy = jest
        .spyOn(metamaskController.seedlessOnboardingController, 'setLocked')
        .mockResolvedValue();
      const keyringSetLockedSpy = jest
        .spyOn(metamaskController.keyringController, 'setLocked')
        .mockResolvedValue();

      await metamaskController.setLocked();

      expect(acquireSpy).toHaveBeenCalled();
      expect(keyringSetLockedSpy).toHaveBeenCalled();
      expect(seedlessSetLockedSpy).toHaveBeenCalled();
      expect(mockReleaseLock).toHaveBeenCalled();
    });

    it('should throw an error if the `seedlessOnboardingController.setLocked` fails', async function () {
      jest
        .spyOn(metamaskController.onboardingController, 'getIsSocialLoginFlow')
        .mockReturnValue(true);
      const seedlessSetLockedSpy = jest
        .spyOn(metamaskController.seedlessOnboardingController, 'setLocked')
        .mockRejectedValue(new Error('error while setting seedless locked'));
      const keyringSetLockedSpy = jest
        .spyOn(metamaskController.keyringController, 'setLocked')
        .mockResolvedValue();

      await expect(metamaskController.setLocked()).rejects.toThrow(
        'error while setting seedless locked',
      );

      expect(seedlessSetLockedSpy).toHaveBeenCalled();
      expect(keyringSetLockedSpy).not.toHaveBeenCalled();
    });

    it('clears existing passkey auto-unlock timer before setting a new one', async function () {
      const existingTimeoutId = setTimeout(() => undefined, 1_000);
      metamaskController.passkeyAutoUnlockSuppressedResetTimeoutId =
        existingTimeoutId;
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      jest
        .spyOn(metamaskController.keyringController, 'setLocked')
        .mockResolvedValue();

      await metamaskController.setLocked();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(existingTimeoutId);
      clearTimeout(
        metamaskController.passkeyAutoUnlockSuppressedResetTimeoutId,
      );
    });
  });

  describe('#addToken', function () {
    const address = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const symbol = 'LINK';
    const decimals = 18;

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
  });

  describe('#removePermissionsFor', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      metamaskController.permissionController = {
        revokePermissions: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.removePermissionsFor({ subject: 'test_subject' }),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        revokePermissions: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.removePermissionsFor({ subject: 'test_subject' }),
      ).toThrow(error);
    });
  });

  describe('#rejectPermissionsRequest', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      metamaskController.permissionController = {
        rejectPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.rejectPermissionsRequest('DUMMY_ID'),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        rejectPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.rejectPermissionsRequest('DUMMY_ID'),
      ).toThrow(error);
    });
  });

  describe('#acceptPermissionsRequest', function () {
    it('should not propagate PermissionsRequestNotFoundError', function () {
      const error = new PermissionsRequestNotFoundError('123');
      metamaskController.permissionController = {
        acceptPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.acceptPermissionsRequest('DUMMY_ID'),
      ).not.toThrow(error);
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        acceptPermissionsRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.acceptPermissionsRequest('DUMMY_ID'),
      ).toThrow(error);
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

  describe('#rejectPendingApproval', function () {
    it('should not propagate ApprovalRequestNotFoundError', function () {
      const error = new ApprovalRequestNotFoundError('123');
      metamaskController.approvalController = {
        rejectRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.rejectPendingApproval('DUMMY_ID', {
          code: 1,
          message: 'DUMMY_MESSAGE',
          data: 'DUMMY_DATA',
        }),
      ).not.toThrow(error);
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.approvalController = {
        rejectRequest: () => {
          throw error;
        },
      };
      expect(() =>
        metamaskController.rejectPendingApproval('DUMMY_ID', {
          code: 1,
          message: 'DUMMY_MESSAGE',
          data: 'DUMMY_DATA',
        }),
      ).toThrow(error);
    });
  });

  describe('#checkIsSeedlessPasswordOutdated', function () {
    it('should return undefined if firstTimeFlowType is not seedless', async function () {
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.create,
      );
      const result = await metamaskController.checkIsSeedlessPasswordOutdated();
      expect(result).toBeFalsy();
    });

    it('should return false if firstTimeFlowType is seedless and password is not outdated', async function () {
      // We now need the Snap keyring after onboarding the wallet.
      jest.spyOn(metamaskController, 'getSnapKeyring').mockReturnValue({});
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
      metamaskController.onboardingController.completeOnboarding();
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockResolvedValue(false);
      const result = await metamaskController.checkIsSeedlessPasswordOutdated();
      expect(result).toBe(false);
      expect(
        metamaskController.seedlessOnboardingController.checkIsPasswordOutdated,
      ).toHaveBeenCalled();
    });

    it('should return true if firstTimeFlowType is seedless and password is outdated', async function () {
      // We now need the Snap keyring after onboarding the wallet.
      jest.spyOn(metamaskController, 'getSnapKeyring').mockReturnValue({});
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
      metamaskController.onboardingController.completeOnboarding();
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockResolvedValue(true);
      const result = await metamaskController.checkIsSeedlessPasswordOutdated();
      expect(result).toBe(true);
      expect(
        metamaskController.seedlessOnboardingController.checkIsPasswordOutdated,
      ).toHaveBeenCalled();
    });

    it('captures the error when password check fails and captureSentryError is true', async function () {
      const error = new Error('Network error');

      jest
        .spyOn(metamaskController.onboardingController, 'getIsSocialLoginFlow')
        .mockReturnValue(true);
      jest
        .spyOn(metamaskController.onboardingController, 'state', 'get')
        .mockReturnValue({ completedOnboarding: true });
      jest
        .spyOn(metamaskController.controllerMessenger, 'captureException')
        .mockImplementation();
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockRejectedValue(error);

      await expect(
        metamaskController.checkIsSeedlessPasswordOutdated({
          skipCache: false,
          captureSentryError: true,
        }),
      ).rejects.toThrow(error);

      expect(
        metamaskController.controllerMessenger.captureException,
      ).toHaveBeenCalledTimes(1);
    });

    it('does not capture the error when password check fails and captureSentryError is false', async function () {
      const error = new Error('Network error');

      jest
        .spyOn(metamaskController.onboardingController, 'getIsSocialLoginFlow')
        .mockReturnValue(true);
      jest
        .spyOn(metamaskController.onboardingController, 'state', 'get')
        .mockReturnValue({ completedOnboarding: true });
      jest
        .spyOn(metamaskController.controllerMessenger, 'captureException')
        .mockImplementation();
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockRejectedValue(error);

      await expect(
        metamaskController.checkIsSeedlessPasswordOutdated({
          skipCache: false,
          captureSentryError: false,
        }),
      ).rejects.toThrow(error);

      expect(
        metamaskController.controllerMessenger.captureException,
      ).not.toHaveBeenCalled();
    });
  });

  describe('#syncPasswordAndUnlockWallet', function () {
    const password = 'test@123';

    beforeEach(function () {
      // Mock the mutex
      metamaskController.seedlessOperationMutex = {
        acquire: jest.fn().mockResolvedValue(() => undefined),
      };
    });

    describe('non-social login flow', function () {
      it('should call submitPassword directly when not social login flow', async function () {
        jest
          .spyOn(
            metamaskController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(false);

        const submitPasswordSpy = jest
          .spyOn(metamaskController, 'submitPassword')
          .mockResolvedValue();

        await metamaskController.syncPasswordAndUnlockWallet(password);

        expect(submitPasswordSpy).toHaveBeenCalledWith(password);
        expect(
          metamaskController.seedlessOperationMutex.acquire,
        ).not.toHaveBeenCalled();
      });
    });

    describe('social login flow with non-outdated password', function () {
      it('should call submitPassword directly when password is not outdated', async function () {
        jest
          .spyOn(
            metamaskController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(true);
        jest
          .spyOn(metamaskController, 'checkIsSeedlessPasswordOutdated')
          .mockResolvedValue(false);

        const submitPasswordSpy = jest
          .spyOn(metamaskController, 'submitPassword')
          .mockResolvedValue();

        await metamaskController.syncPasswordAndUnlockWallet(password);

        expect(submitPasswordSpy).toHaveBeenCalledWith(password);
        expect(
          metamaskController.seedlessOperationMutex.acquire,
        ).not.toHaveBeenCalled();
      });
    });

    describe('social login flow with outdated password', function () {
      beforeEach(function () {
        jest
          .spyOn(
            metamaskController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(true);
        jest
          .spyOn(metamaskController, 'checkIsSeedlessPasswordOutdated')
          .mockResolvedValue(true);
      });

      it('should throw OutdatedPassword error when password verification succeeds', async function () {
        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockResolvedValue(true);
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockRejectedValue(
            new RecoveryError(
              SeedlessOnboardingControllerErrorMessage.IncorrectPassword,
            ),
          );
        await expect(
          metamaskController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow(
          SeedlessOnboardingControllerErrorMessage.OutdatedPassword,
        );
      });

      it('should handle ratelimited RecoveryError from submitGlobalPassword', async function () {
        const releaseLock = jest.fn();

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockRejectedValue(
            new RecoveryError(
              SeedlessOnboardingControllerErrorMessage.TooManyLoginAttempts,
            ),
          );

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          metamaskController.syncPasswordAndUnlockWallet(password),
        ).rejects.toMatchObject({
          code: -32603,
          message:
            SeedlessOnboardingControllerErrorMessage.TooManyLoginAttempts,
        });

        expect(releaseLock).toHaveBeenCalled();
      });

      it('should successfully sync password when password verification fails', async function () {
        const currentPasswordEncryptionKey = 'encryption-key';
        const releaseLock = jest.fn();

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'loadKeyringEncryptionKey',
          )
          .mockResolvedValue(currentPasswordEncryptionKey);
        jest
          .spyOn(metamaskController, 'submitEncryptionKey')
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        jest
          .spyOn(metamaskController, 'syncKeyringEncryptionKey')
          .mockResolvedValue();

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await metamaskController.syncPasswordAndUnlockWallet(password);

        expect(
          metamaskController.seedlessOperationMutex.acquire,
        ).toHaveBeenCalled();
        expect(
          metamaskController.keyringController.verifyPassword,
        ).toHaveBeenCalledWith(password);
        expect(
          metamaskController.seedlessOnboardingController.submitGlobalPassword,
        ).toHaveBeenCalledWith({
          globalPassword: password,
          maxKeyChainLength: 20,
        });
        expect(
          metamaskController.seedlessOnboardingController
            .loadKeyringEncryptionKey,
        ).toHaveBeenCalled();
        expect(metamaskController.submitEncryptionKey).toHaveBeenCalledWith(
          currentPasswordEncryptionKey,
        );
        expect(
          metamaskController.seedlessOnboardingController
            .syncLatestGlobalPassword,
        ).toHaveBeenCalledWith({
          globalPassword: password,
        });
        expect(
          metamaskController.keyringController.changePassword,
        ).toHaveBeenCalledWith(password);
        expect(metamaskController.syncKeyringEncryptionKey).toHaveBeenCalled();
        expect(
          metamaskController.checkIsSeedlessPasswordOutdated,
        ).toHaveBeenNthCalledWith(1, {
          skipCache: false,
          captureSentryError: true,
        });
        expect(
          metamaskController.checkIsSeedlessPasswordOutdated,
        ).toHaveBeenNthCalledWith(2, {
          skipCache: true,
          captureSentryError: true,
        });
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should lock wallet and throw error when sync fails', async function () {
        const releaseLock = jest.fn();
        const syncError = new Error('Sync failed');

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'loadKeyringEncryptionKey',
          )
          .mockResolvedValue('encryption-key');
        jest
          .spyOn(metamaskController, 'submitEncryptionKey')
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockRejectedValue(syncError);
        jest.spyOn(metamaskController, 'setLocked').mockResolvedValue();

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          metamaskController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Sync failed');

        expect(metamaskController.setLocked).toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should lock wallet and throw error when changePassword fails', async function () {
        const releaseLock = jest.fn();
        const changePasswordError = new Error('Change password failed');

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'loadKeyringEncryptionKey',
          )
          .mockResolvedValue('encryption-key');
        jest
          .spyOn(metamaskController, 'submitEncryptionKey')
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockRejectedValue(changePasswordError);
        jest.spyOn(metamaskController, 'setLocked').mockResolvedValue();

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          metamaskController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Change password failed');

        expect(metamaskController.setLocked).toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalled();
      });

      it('should unlock wallet when `revokePendingRefreshTokens` fails for non-outdated password', async function () {
        jest
          .spyOn(metamaskController, 'checkIsSeedlessPasswordOutdated')
          .mockResolvedValue(false);
        const keyringSubmitPwdSpy = jest
          .spyOn(metamaskController.keyringController, 'submitPassword')
          .mockResolvedValue();
        const seedlessSubmitPwdSpy = jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'revokePendingRefreshTokens',
          )
          .mockRejectedValue('Unexpected error');

        // We now need the Snap keyring after unlocking the wallet.
        jest.spyOn(metamaskController, 'getSnapKeyring').mockReturnValue({});

        await metamaskController.syncPasswordAndUnlockWallet(password);
        expect(keyringSubmitPwdSpy).toHaveBeenCalled();
        expect(seedlessSubmitPwdSpy).toHaveBeenCalled();
        expect(
          metamaskController.seedlessOnboardingController
            .revokePendingRefreshTokens,
        ).toHaveBeenCalled();
      });

      it('should unlock wallet when `revokePendingRefreshTokens` fails for outdated password', async function () {
        const releaseLock = jest.fn();

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockResolvedValue(true);
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockResolvedValue();
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'loadKeyringEncryptionKey',
          )
          .mockResolvedValue('encryption-key');
        jest
          .spyOn(metamaskController, 'submitEncryptionKey')
          .mockResolvedValue();
        jest
          .spyOn(metamaskController, 'syncKeyringEncryptionKey')
          .mockResolvedValue();
        jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        const syncLatestGlobalPasswordSpy = jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'syncLatestGlobalPassword',
          )
          .mockResolvedValue();
        const setLockedSpy = jest
          .spyOn(metamaskController, 'setLocked')
          .mockResolvedValue();

        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'revokePendingRefreshTokens',
          )
          .mockRejectedValue('Unexpected error');

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await metamaskController.syncPasswordAndUnlockWallet(password);

        expect(metamaskController.setLocked).not.toHaveBeenCalled();
        expect(syncLatestGlobalPasswordSpy).toHaveBeenCalled();
        expect(setLockedSpy).not.toHaveBeenCalled();
        expect(
          metamaskController.seedlessOnboardingController
            .revokePendingRefreshTokens,
        ).toHaveBeenCalled();
      });

      it('should allow user to unlock the wallet even if checkIsPasswordOutdated fails', async function () {
        jest
          .spyOn(metamaskController, 'checkIsSeedlessPasswordOutdated')
          .mockRejectedValue('Network Error');
        const keyringSubmitPwdSpy = jest
          .spyOn(metamaskController.keyringController, 'submitPassword')
          .mockResolvedValue();
        const seedlessSubmitPwdSpy = jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitPassword',
          )
          .mockResolvedValue();

        // We now need the Snap keyring after unlocking the wallet.
        jest.spyOn(metamaskController, 'getSnapKeyring').mockReturnValue({});

        await metamaskController.syncPasswordAndUnlockWallet(password);
        expect(keyringSubmitPwdSpy).toHaveBeenCalled();
        expect(seedlessSubmitPwdSpy).toHaveBeenCalled();
      });

      it('should always release lock even when errors occur', async function () {
        const releaseLock = jest.fn();

        jest
          .spyOn(metamaskController.keyringController, 'verifyPassword')
          .mockRejectedValue(new Error('Incorrect password'));
        jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'submitGlobalPassword',
          )
          .mockRejectedValue(new Error('Recovery failed'));

        metamaskController.seedlessOperationMutex.acquire.mockResolvedValue(
          releaseLock,
        );

        await expect(
          metamaskController.syncPasswordAndUnlockWallet(password),
        ).rejects.toThrow('Recovery failed');

        expect(releaseLock).toHaveBeenCalled();
      });
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

        const result =
          await metamaskController.generatePasskeyRegistrationOptions({
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

        const result =
          await metamaskController.generatePasskeyAuthenticationOptions();

        expect(generateAuthenticationOptionsSpy).toHaveBeenCalledTimes(1);
        expect(result).toStrictEqual({ challenge: 'challenge' });
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
          metamaskController.protectVaultKeyWithPasskey(registrationResponse),
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
          .spyOn(metamaskController, 'verifyPassword')
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
          'password',
        );

        expect(verifyPasswordSpy).toHaveBeenCalledWith('password');
        expect(protectVaultKeySpy).toHaveBeenCalledWith({
          registrationResponse,
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
          metamaskController,
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
        );

        expect(verifyPasswordSpy).not.toHaveBeenCalled();
        expect(protectVaultKeySpy).toHaveBeenCalledWith({
          registrationResponse,
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
          metamaskController,
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
          .spyOn(metamaskController, 'verifyPassword')
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
        ).rejects.toThrow(renewError);

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
    });

    describe('#changePassword', function () {
      it('does not remove passkey after keyring password change', async function () {
        const releaseLock = jest.fn();
        jest
          .spyOn(metamaskController.seedlessOperationMutex, 'acquire')
          .mockResolvedValue(releaseLock);
        jest
          .spyOn(
            metamaskController.onboardingController,
            'getIsSocialLoginFlow',
          )
          .mockReturnValue(false);
        const changePasswordSpy = jest
          .spyOn(metamaskController.keyringController, 'changePassword')
          .mockResolvedValue();
        jest
          .spyOn(metamaskController.passkeyController, 'isPasskeyEnrolled')
          .mockReturnValue(true);
        const removePasskeySpy = jest
          .spyOn(metamaskController.passkeyController, 'removePasskey')
          .mockReturnValue();

        await metamaskController.changePassword('new-password', 'old-password');

        expect(changePasswordSpy).toHaveBeenCalledWith('new-password');
        expect(removePasskeySpy).not.toHaveBeenCalled();
        expect(releaseLock).toHaveBeenCalledTimes(1);
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
        jest.spyOn(metamaskController, 'submitPassword').mockResolvedValue();

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
            generatePasskeyAuthenticationOptions: expect.any(Function),
            protectVaultKeyWithPasskey: expect.any(Function),
            unlockWithPasskey: expect.any(Function),
            removePasskeyWithPasskeyVerification: expect.any(Function),
            removePasskeyWithPasswordVerification: expect.any(Function),
            changePasswordWithPasskeyVerification: expect.any(Function),
          }),
        );
      });
    });
  });
});
