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
import mockEncryptor from '../../test/lib/mock-encryptor';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import MetaMaskController from './metamask-controller';

const { Ganache } = require('../../test/e2e/seeder/ganache');

const ganacheServer = new Ganache();

const browserPolyfillMock = {
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
      get: jest.fn().mockReturnValue({}),
      set: jest.fn(),
    },
  },
};

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
    });
    initializeMockMiddlewareLog();

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
        'https://phishing-detection.api.cx.metamask.io/v1/diffsSince',
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

      // On restore, a new keyring metadata is generated.
      expect(result1.keyrings[0].metadata.id).toBe(mockULIDs[0]);
      expect(result2).toStrictEqual({
        ...result1,
        keyrings: [
          {
            ...result1.keyrings[0],
            metadata: {
              ...result1.keyrings[0].metadata,
              id: mockULIDs[1],
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
        .spyOn(metamaskController.controllerMessenger, 'call')
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
        accept: () => {
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
        accept: () => {
          throw error;
        },
      };
      await expect(
        metamaskController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
      ).rejects.toThrow(error);
    });
  });

  describe('#rejectPendingApproval', function () {
    it('should not propagate ApprovalRequestNotFoundError', function () {
      const error = new ApprovalRequestNotFoundError('123');
      metamaskController.approvalController = {
        reject: () => {
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
        reject: () => {
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
      expect(result).toBeUndefined();
    });

    it('should return false if firstTimeFlowType is seedless and password is not outdated', async function () {
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
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
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );
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
  });

  describe('#submitLatestGlobalSeedlessPassword', function () {
    const globalPassword = 'newGlobalPassword';
    const currentDevicePassword = 'oldDevicePassword';

    beforeEach(() => {
      // Reset spies for each test
      jest.restoreAllMocks();
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.socialCreate,
      );

      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'recoverCurrentDevicePassword',
        )
        .mockResolvedValue({ password: currentDevicePassword });
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'syncLatestGlobalPassword',
        )
        .mockResolvedValue(undefined);
      jest
        .spyOn(metamaskController, 'submitPassword')
        .mockResolvedValue(undefined);
      jest
        .spyOn(metamaskController.keyringController, 'changePassword')
        .mockResolvedValue(undefined);
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'checkIsPasswordOutdated',
        )
        .mockResolvedValue(false); // Default to not outdated
    });

    it('should successfully sync password if flow is seedless', async function () {
      await metamaskController.submitLatestGlobalSeedlessPassword(
        globalPassword,
      );

      expect(
        metamaskController.seedlessOnboardingController
          .recoverCurrentDevicePassword,
      ).toHaveBeenCalledWith({ globalPassword });
      expect(
        metamaskController.seedlessOnboardingController
          .syncLatestGlobalPassword,
      ).toHaveBeenCalledWith({
        oldPassword: currentDevicePassword,
        globalPassword,
      });
      expect(metamaskController.submitPassword).toHaveBeenCalledWith(
        currentDevicePassword,
      );
      expect(
        metamaskController.keyringController.changePassword,
      ).toHaveBeenCalledWith(globalPassword);
      expect(
        metamaskController.seedlessOnboardingController.checkIsPasswordOutdated,
      ).toHaveBeenCalledWith({ skipCache: true });
    });

    it('should throw an error if firstTimeFlowType is not seedless', async function () {
      metamaskController.onboardingController.setFirstTimeFlowType(
        FirstTimeFlowType.create,
      ); // Not seedless

      await expect(
        metamaskController.submitLatestGlobalSeedlessPassword(globalPassword),
      ).rejects.toThrow(
        'This method is only available for seedless onboarding flow',
      );
    });

    it('should throw and not proceed if recoverCurrentDevicePassword fails', async function () {
      const recoveryError = new Error('Recovery failed');
      jest
        .spyOn(
          metamaskController.seedlessOnboardingController,
          'recoverCurrentDevicePassword',
        )
        .mockRejectedValue(recoveryError);

      const syncSpy = jest.spyOn(
        metamaskController.seedlessOnboardingController,
        'syncLatestGlobalPassword',
      );
      const submitPasswordSpy = jest.spyOn(
        metamaskController,
        'submitPassword',
      );
      const changePasswordSpy = jest.spyOn(
        metamaskController.keyringController,
        'changePassword',
      );

      await expect(
        metamaskController.submitLatestGlobalSeedlessPassword(globalPassword),
      ).rejects.toThrow(recoveryError);

      expect(syncSpy).not.toHaveBeenCalled();
      expect(submitPasswordSpy).not.toHaveBeenCalled();
      expect(changePasswordSpy).not.toHaveBeenCalled();
    });
  });
});
