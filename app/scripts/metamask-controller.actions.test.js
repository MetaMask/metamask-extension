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

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

describe('MetaMaskController', function () {
  let metamaskController;
  const noop = () => undefined;

  beforeAll(async function () {
    await ganacheServer.start();
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
          phishfort_hotlist: {
            blocklist: [],
            name: ListNames.Phishfort,
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
    it('two sequential calls with same strategy give same result', async function () {
      let keyringControllerState1;
      let keyringControllerState2;
      const importPrivkey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

      await metamaskController.createNewVaultAndKeychain('test@123');
      await Promise.all([
        metamaskController.importAccountWithStrategy('privateKey', [
          importPrivkey,
        ]),
        Promise.resolve(1).then(() => {
          keyringControllerState1 = JSON.stringify(
            metamaskController.keyringController.state,
          );
          metamaskController.importAccountWithStrategy('privateKey', [
            importPrivkey,
          ]);
        }),
        Promise.resolve(2).then(() => {
          keyringControllerState2 = JSON.stringify(
            metamaskController.keyringController.state,
          );
        }),
      ]);
      expect(keyringControllerState1).toStrictEqual(keyringControllerState2);
    });
  });

  describe('#createNewVaultAndRestore', function () {
    it('two successive calls with same inputs give same result', async function () {
      const result1 = await metamaskController.createNewVaultAndRestore(
        'test@123',
        TEST_SEED,
      );
      const result2 = await metamaskController.createNewVaultAndRestore(
        'test@123',
        TEST_SEED,
      );
      expect(result1).toStrictEqual(result2);
    });
  });

  describe('#createNewVaultAndKeychain', function () {
    it('two successive calls with same inputs give same result', async function () {
      const result1 = await metamaskController.createNewVaultAndKeychain(
        'test@123',
      );
      const result2 = await metamaskController.createNewVaultAndKeychain(
        'test@123',
      );
      expect(result1).not.toStrictEqual(undefined);
      expect(result1).toStrictEqual(result2);
    });
  });

  describe('#setLocked', function () {
    it('should lock the wallet', async function () {
      const { isUnlocked, keyrings } = await metamaskController.setLocked();
      expect(isUnlocked).toStrictEqual(false);
      expect(keyrings).toStrictEqual([]);
    });
  });

  describe('#addToken', function () {
    const address = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const symbol = 'LINK';
    const decimals = 18;

    it('two parallel calls with same token details give same result', async function () {
      const supportsInterfaceStub = jest.fn().mockResolvedValue(false);
      jest
        .spyOn(metamaskController.tokensController, '_createEthersContract')
        .mockResolvedValue({ supportsInterface: supportsInterfaceStub });

      const [token1, token2] = await Promise.all([
        metamaskController.getApi().addToken({ address, symbol, decimals }),
        metamaskController.getApi().addToken({ address, symbol, decimals }),
      ]);
      expect(token1).toStrictEqual(token2);
    });

    it('networkClientId is used when provided', async function () {
      const supportsInterfaceStub = jest.fn().mockResolvedValue(false);
      jest
        .spyOn(metamaskController.tokensController, '_createEthersContract')
        .mockResolvedValue({ supportsInterface: supportsInterfaceStub });
      const callSpy = jest
        .spyOn(metamaskController.controllerMessenger, 'call')
        .mockReturnValue({ configuration: { chainId: '0xa' } });

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
});
