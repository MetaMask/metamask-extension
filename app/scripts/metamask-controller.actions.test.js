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

  describe('#importAccountWithStrategy', function () {
    it('two sequential calls with same strategy give same result', async function () {
      let keyringControllerState1;
      let keyringControllerState2;
      const importPrivkey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

      await metamaskController.createNewVaultAndKeychain('test@123');
      await Promise.all([
        metamaskController.importAccountWithStrategy('Private Key', [
          importPrivkey,
        ]),
        Promise.resolve(1).then(() => {
          keyringControllerState1 = JSON.stringify(
            metamaskController.keyringController.memStore.getState(),
          );
          metamaskController.importAccountWithStrategy('Private Key', [
            importPrivkey,
          ]);
        }),
        Promise.resolve(2).then(() => {
          keyringControllerState2 = JSON.stringify(
            metamaskController.keyringController.memStore.getState(),
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
        metamaskController.getApi().addToken(address, symbol, decimals),
        metamaskController.getApi().addToken(address, symbol, decimals),
      ]);
      assert.deepEqual(token1, token2);
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
    it('two successive calls with custom RPC details give same result', async function () {
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
