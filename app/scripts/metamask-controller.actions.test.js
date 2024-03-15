import { strict as assert } from 'assert';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
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

const { Ganache } = require('../../test/e2e/ganache');

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
      get: sinon.stub().resolves({}),
      set: sinon.stub().resolves(),
    },
  },
};

let loggerMiddlewareMock;
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

const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';

const MetaMaskController = proxyquire('./metamask-controller', {
  './lib/createLoggerMiddleware': { default: createLoggerMiddlewareMock },
}).default;

describe('MetaMaskController', function () {
  let metamaskController;
  const sandbox = sinon.createSandbox();
  const noop = () => undefined;

  before(async function () {
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
  });

  afterEach(function () {
    sandbox.restore();
    nock.cleanAll();
  });

  after(async function () {
    await ganacheServer.quit();
  });

  describe('Phishing Detection Mock', function () {
    it('should be updated to use v1 of the API', function () {
      // Update the fixture above if this test fails
      assert.equal(
        METAMASK_STALELIST_URL,
        'https://phishing-detection.metafi.codefi.network/v1/stalelist',
      );
      assert.equal(
        METAMASK_HOTLIST_DIFF_URL,
        'https://phishing-detection.metafi.codefi.network/v1/diffsSince',
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
      assert.equal(addNewAccountResult1, addNewAccountResult2);
    });

    it('two successive calls with same accountCount give same result', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(1);
      assert.equal(addNewAccountResult1, addNewAccountResult2);
    });

    it('two successive calls with different accountCount give different results', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(2);
      assert.notEqual(addNewAccountResult1, addNewAccountResult2);
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
      assert.deepEqual(keyringControllerState1, keyringControllerState2);
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
      assert.deepEqual(result1, result2);
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
      assert.notEqual(result1, undefined);
      assert.deepEqual(result1, result2);
    });
  });

  describe('#setLocked', function () {
    it('should lock the wallet', async function () {
      const { isUnlocked, keyrings } = await metamaskController.setLocked();
      assert(!isUnlocked);
      assert.deepEqual(keyrings, []);
    });
  });

  describe('#addToken', function () {
    const address = '0x514910771af9ca656af840dff83e8264ecf986ca';
    const symbol = 'LINK';
    const decimals = 18;

    it('two parallel calls with same token details give same result', async function () {
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));
      sinon
        .stub(metamaskController.tokensController, '_createEthersContract')
        .callsFake(() =>
          Promise.resolve({ supportsInterface: supportsInterfaceStub }),
        );

      const [token1, token2] = await Promise.all([
        metamaskController.getApi().addToken({ address, symbol, decimals }),
        metamaskController.getApi().addToken({ address, symbol, decimals }),
      ]);
      assert.deepEqual(token1, token2);
    });

    it('networkClientId is used when provided', async function () {
      const supportsInterfaceStub = sinon
        .stub()
        .returns(Promise.resolve(false));
      sinon
        .stub(metamaskController.tokensController, '_createEthersContract')
        .callsFake(() =>
          Promise.resolve({ supportsInterface: supportsInterfaceStub }),
        );
      sinon
        .stub(metamaskController.controllerMessenger, 'call')
        .callsFake(() => ({
          configuration: {
            chainId: '0xa',
          },
        }));

      await metamaskController.getApi().addToken({
        address,
        symbol,
        decimals,
        networkClientId: 'networkClientId1',
      });
      assert.deepStrictEqual(
        metamaskController.controllerMessenger.call.getCall(0).args,
        ['NetworkController:getNetworkClientById', 'networkClientId1'],
      );
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
      // Line below will not throw error, in case it throws this test case will fail.
      metamaskController.removePermissionsFor({ subject: 'test_subject' });
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        revokePermissions: () => {
          throw error;
        },
      };
      assert.throws(() => {
        metamaskController.removePermissionsFor({ subject: 'test_subject' });
      }, error);
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
      // Line below will not throw error, in case it throws this test case will fail.
      metamaskController.rejectPermissionsRequest('DUMMY_ID');
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        rejectPermissionsRequest: () => {
          throw error;
        },
      };
      assert.throws(() => {
        metamaskController.rejectPermissionsRequest('DUMMY_ID');
      }, error);
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
      // Line below will not throw error, in case it throws this test case will fail.
      metamaskController.acceptPermissionsRequest('DUMMY_ID');
    });

    it('should propagate Error other than PermissionsRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.permissionController = {
        acceptPermissionsRequest: () => {
          throw error;
        },
      };
      assert.throws(() => {
        metamaskController.acceptPermissionsRequest('DUMMY_ID');
      }, error);
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
      // Line below will not throw error, in case it throws this test case will fail.
      await metamaskController.resolvePendingApproval(
        'DUMMY_ID',
        'DUMMY_VALUE',
      );
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.approvalController = {
        accept: () => {
          throw error;
        },
      };
      assert.rejects(
        () =>
          metamaskController.resolvePendingApproval('DUMMY_ID', 'DUMMY_VALUE'),
        error,
      );
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
      // Line below will not throw error, in case it throws this test case will fail.
      metamaskController.rejectPendingApproval('DUMMY_ID', {
        code: 1,
        message: 'DUMMY_MESSAGE',
        data: 'DUMMY_DATA',
      });
    });

    it('should propagate Error other than ApprovalRequestNotFoundError', function () {
      const error = new Error();
      metamaskController.approvalController = {
        reject: () => {
          throw error;
        },
      };
      assert.throws(() => {
        metamaskController.rejectPendingApproval('DUMMY_ID', {
          code: 1,
          message: 'DUMMY_MESSAGE',
          data: 'DUMMY_DATA',
        });
      }, error);
    });
  });
});
