import { strict as assert } from 'assert';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const Ganache = require('../../test/e2e/ganache');

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
    metamaskController = new MetaMaskController({
      showUserConfirmation: noop,
      encryptor: {
        encrypt(_, object) {
          this.object = object;
          return Promise.resolve('mock-encrypted');
        },
        decrypt() {
          return Promise.resolve(this.object);
        },
      },
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
  });

  after(async function () {
    await ganacheServer.quit();
  });

  describe('#addNewAccount', function () {
    it('two parallel calls with same accountCount give same result', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const [addNewAccountResult1, addNewAccountResult2] = await Promise.all([
        metamaskController.addNewAccount(1),
        metamaskController.addNewAccount(1),
      ]);
      assert.deepEqual(
        Object.keys(addNewAccountResult1.identities),
        Object.keys(addNewAccountResult2.identities),
      );
    });

    it('two successive calls with same accountCount give same result', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(1);
      assert.deepEqual(
        Object.keys(addNewAccountResult1.identities),
        Object.keys(addNewAccountResult2.identities),
      );
    });

    it('two successive calls with different accountCount give different results', async function () {
      await metamaskController.createNewVaultAndKeychain('test@123');
      const addNewAccountResult1 = await metamaskController.addNewAccount(1);
      const addNewAccountResult2 = await metamaskController.addNewAccount(2);
      assert.notDeepEqual(addNewAccountResult1, addNewAccountResult2);
    });
  });

  describe('#addCustomNetwork', function () {
    const customRpc = {
      chainId: '0x1',
      chainName: 'DUMMY_CHAIN_NAME',
      rpcUrl: 'DUMMY_RPCURL',
      ticker: 'DUMMY_TICKER',
      blockExplorerUrl: 'DUMMY_EXPLORER',
    };
    it('two calls with same accountCount give same result', async function () {
      await metamaskController.addCustomNetwork(customRpc);
      const rpcList1Length =
        metamaskController.preferencesController.store.getState()
          .frequentRpcListDetail.length;
      await metamaskController.addCustomNetwork(customRpc);
      const rpcList2Length =
        metamaskController.preferencesController.store.getState()
          .frequentRpcListDetail.length;
      assert.equal(rpcList1Length, rpcList2Length);
    });
  });
});
