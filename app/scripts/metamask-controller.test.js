import { strict as assert } from 'assert';
import sinon from 'sinon';
import { cloneDeep } from 'lodash';
import nock from 'nock';
import { pubToAddress, bufferToHex } from 'ethereumjs-util';
import { obj as createThoughStream } from 'through2';
import EthQuery from 'eth-query';
import proxyquire from 'proxyquire';
import { TRANSACTION_STATUSES } from '../../shared/constants/transaction';
import createTxMeta from '../../test/lib/createTxMeta';
import { NETWORK_TYPE_RPC } from '../../shared/constants/network';
import { addHexPrefix } from './lib/util';

const Ganache = require('../../test/e2e/ganache');

const firstTimeState = {
  config: {},
  NetworkController: {
    provider: {
      type: NETWORK_TYPE_RPC,
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
    },
    networkDetails: {
      EIPS: {
        1559: false,
      },
    },
  },
};

const ganacheServer = new Ganache();

const threeBoxSpies = {
  init: sinon.stub(),
  getThreeBoxSyncingState: sinon.stub().returns(true),
  turnThreeBoxSyncingOn: sinon.stub(),
  _registerUpdates: sinon.spy(),
};

class ThreeBoxControllerMock {
  constructor() {
    this.store = {
      subscribe: () => undefined,
      getState: () => ({}),
    };
    this.init = threeBoxSpies.init;
    this.getThreeBoxSyncingState = threeBoxSpies.getThreeBoxSyncingState;
    this.turnThreeBoxSyncingOn = threeBoxSpies.turnThreeBoxSyncingOn;
    this._registerUpdates = threeBoxSpies._registerUpdates;
  }
}

const ExtensionizerMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: () => undefined,
    },
    getPlatformInfo: async () => 'mac',
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

const MetaMaskController = proxyquire('./metamask-controller', {
  './controllers/threebox': { default: ThreeBoxControllerMock },
  './lib/createLoggerMiddleware': { default: createLoggerMiddlewareMock },
}).default;

const currentNetworkId = '42';
const DEFAULT_LABEL = 'Account 1';
const DEFAULT_LABEL_2 = 'Account 2';
const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const TEST_SEED_ALT =
  'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const CUSTOM_RPC_URL = 'http://localhost:8545';
const CUSTOM_RPC_CHAIN_ID = '0x539';

describe('MetaMaskController', function () {
  let metamaskController;
  const sandbox = sinon.createSandbox();
  const noop = () => undefined;

  before(async function () {
    await ganacheServer.start();
  });

  beforeEach(function () {
    nock('https://min-api.cryptocompare.com')
      .persist()
      .get(/.*/u)
      .reply(200, '{"JPY":12415.9}');

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
      initState: cloneDeep(firstTimeState),
      initLangCode: 'en_US',
      platform: {
        showTransactionNotification: () => undefined,
        getVersion: () => 'foo',
      },
      extension: ExtensionizerMock,
      infuraProjectId: 'foo',
    });

    // add sinon method spies
    sandbox.spy(
      metamaskController.keyringController,
      'createNewVaultAndKeychain',
    );
    sandbox.spy(
      metamaskController.keyringController,
      'createNewVaultAndRestore',
    );
  });

  afterEach(function () {
    nock.cleanAll();
    sandbox.restore();
  });

  after(async function () {
    await ganacheServer.quit();
  });

  describe('#getAccounts', function () {
    it('returns first address when dapp calls web3.eth.getAccounts', async function () {
      const password = 'a-fake-password';
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED);

      metamaskController.networkController._baseProviderParams.getAccounts(
        (err, res) => {
          assert.ifError(err);
          assert.equal(res.length, 1);
          assert.equal(res[0], '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc');
        },
      );
    });
  });

  describe('#importAccountWithStrategy', function () {
    const importPrivkey =
      '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

    beforeEach(async function () {
      const password = 'a-fake-password';
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
      await metamaskController.importAccountWithStrategy('Private Key', [
        importPrivkey,
      ]);
    });

    it('adds private key to keyrings in KeyringController', async function () {
      const simpleKeyrings = metamaskController.keyringController.getKeyringsByType(
        'Simple Key Pair',
      );
      const privKeyBuffer = simpleKeyrings[0].wallets[0].privateKey;
      const pubKeyBuffer = simpleKeyrings[0].wallets[0].publicKey;
      const addressBuffer = pubToAddress(pubKeyBuffer);
      const privKey = bufferToHex(privKeyBuffer);
      const pubKey = bufferToHex(addressBuffer);
      assert.equal(privKey, addHexPrefix(importPrivkey));
      assert.equal(pubKey, '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc');
    });

    it('adds 1 account', async function () {
      const keyringAccounts = await metamaskController.keyringController.getAccounts();
      assert.equal(
        keyringAccounts[keyringAccounts.length - 1],
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
      );
    });
  });

  describe('submitPassword', function () {
    const password = 'password';

    beforeEach(async function () {
      await metamaskController.createNewVaultAndKeychain(password);
      threeBoxSpies.init.reset();
      threeBoxSpies.turnThreeBoxSyncingOn.reset();
    });

    it('removes any identities that do not correspond to known accounts.', async function () {
      const fakeAddress = '0xbad0';
      metamaskController.preferencesController.addAddresses([fakeAddress]);
      await metamaskController.submitPassword(password);

      const identities = Object.keys(
        metamaskController.preferencesController.store.getState().identities,
      );
      const addresses = await metamaskController.keyringController.getAccounts();

      identities.forEach((identity) => {
        assert.ok(
          addresses.includes(identity),
          `addresses should include all IDs: ${identity}`,
        );
      });

      addresses.forEach((address) => {
        assert.ok(
          identities.includes(address),
          `identities should include all Addresses: ${address}`,
        );
      });
    });

    it('gets the address from threebox and creates a new 3box instance', async function () {
      await metamaskController.submitPassword(password);
      assert(threeBoxSpies.init.calledOnce);
      assert(threeBoxSpies.turnThreeBoxSyncingOn.calledOnce);
    });

    it('succeeds even if blockTracker or threeBoxController throw', async function () {
      const throwErr = sinon.fake.throws('foo');
      metamaskController.blockTracker.checkForLatestBlock = throwErr;
      metamaskController.threeBoxController.getThreeBoxSyncingState = throwErr;
      await metamaskController.submitPassword(password);
      assert.ok(
        throwErr.calledTwice,
        'should have called checkForLatestBlock and getThreeBoxSyncingState',
      );
    });
  });

  describe('#createNewVaultAndKeychain', function () {
    it('can only create new vault on keyringController once', async function () {
      const selectStub = sandbox.stub(
        metamaskController,
        'selectFirstIdentity',
      );

      const password = 'a-fake-password';

      await metamaskController.createNewVaultAndKeychain(password);
      await metamaskController.createNewVaultAndKeychain(password);

      assert(
        metamaskController.keyringController.createNewVaultAndKeychain
          .calledOnce,
      );

      selectStub.reset();
    });
  });

  describe('#createNewVaultAndRestore', function () {
    it('should be able to call newVaultAndRestore despite a mistake.', async function () {
      const password = 'what-what-what';
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.callsFake(() => {
        return Promise.resolve('0x0');
      });

      await metamaskController
        .createNewVaultAndRestore(password, TEST_SEED.slice(0, -1))
        .catch(() => null);
      await metamaskController.createNewVaultAndRestore(password, TEST_SEED);

      assert(
        metamaskController.keyringController.createNewVaultAndRestore
          .calledTwice,
      );
    });

    it('should clear previous identities after vault restoration', async function () {
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.callsFake(() => {
        return Promise.resolve('0x0');
      });

      let startTime = Date.now();
      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED,
      );
      let endTime = Date.now();

      const firstVaultIdentities = cloneDeep(
        metamaskController.getState().identities,
      );
      assert.ok(
        firstVaultIdentities[TEST_ADDRESS].lastSelected >= startTime &&
          firstVaultIdentities[TEST_ADDRESS].lastSelected <= endTime,
        `'${firstVaultIdentities[TEST_ADDRESS].lastSelected}' expected to be between '${startTime}' and '${endTime}'`,
      );
      delete firstVaultIdentities[TEST_ADDRESS].lastSelected;
      assert.deepEqual(firstVaultIdentities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
      });

      await metamaskController.preferencesController.setAccountLabel(
        TEST_ADDRESS,
        'Account Foo',
      );

      const labelledFirstVaultIdentities = cloneDeep(
        metamaskController.getState().identities,
      );
      delete labelledFirstVaultIdentities[TEST_ADDRESS].lastSelected;
      assert.deepEqual(labelledFirstVaultIdentities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: 'Account Foo' },
      });

      startTime = Date.now();
      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED_ALT,
      );
      endTime = Date.now();

      const secondVaultIdentities = cloneDeep(
        metamaskController.getState().identities,
      );
      assert.ok(
        secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected >= startTime &&
          secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected <= endTime,
        `'${secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected}' expected to be between '${startTime}' and '${endTime}'`,
      );
      delete secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected;
      assert.deepEqual(secondVaultIdentities, {
        [TEST_ADDRESS_ALT]: { address: TEST_ADDRESS_ALT, name: DEFAULT_LABEL },
      });
    });

    it('should restore any consecutive accounts with balances', async function () {
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.withArgs(TEST_ADDRESS).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000');
      });
      metamaskController.getBalance.withArgs(TEST_ADDRESS_2).callsFake(() => {
        return Promise.resolve('0x0');
      });
      metamaskController.getBalance.withArgs(TEST_ADDRESS_3).callsFake(() => {
        return Promise.resolve('0x14ced5122ce0a000');
      });

      const startTime = Date.now();
      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED,
      );

      const identities = cloneDeep(metamaskController.getState().identities);
      assert.ok(
        identities[TEST_ADDRESS].lastSelected >= startTime &&
          identities[TEST_ADDRESS].lastSelected <= Date.now(),
      );
      delete identities[TEST_ADDRESS].lastSelected;
      assert.deepEqual(identities, {
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
        [TEST_ADDRESS_2]: { address: TEST_ADDRESS_2, name: DEFAULT_LABEL_2 },
      });
    });
  });

  describe('#getBalance', function () {
    it('should return the balance known by accountTracker', async function () {
      const accounts = {};
      const balance = '0x14ced5122ce0a000';
      accounts[TEST_ADDRESS] = { balance };

      metamaskController.accountTracker.store.putState({ accounts });

      const gotten = await metamaskController.getBalance(TEST_ADDRESS);

      assert.equal(balance, gotten);
    });

    it('should ask the network for a balance when not known by accountTracker', async function () {
      const accounts = {};
      const balance = '0x14ced5122ce0a000';
      const ethQuery = new EthQuery();
      sinon.stub(ethQuery, 'getBalance').callsFake((_, callback) => {
        callback(undefined, balance);
      });

      metamaskController.accountTracker.store.putState({ accounts });

      const gotten = await metamaskController.getBalance(
        TEST_ADDRESS,
        ethQuery,
      );

      assert.equal(balance, gotten);
    });
  });

  describe('#getApi', function () {
    it('getState', function (done) {
      let state;
      const getApi = metamaskController.getApi();
      getApi.getState((err, res) => {
        if (err) {
          done(err);
        } else {
          state = res;
        }
      });
      assert.deepEqual(state, metamaskController.getState());
      done();
    });
  });

  describe('preferencesController', function () {
    it('defaults useBlockie to false', function () {
      assert.equal(
        metamaskController.preferencesController.store.getState().useBlockie,
        false,
      );
    });

    it('setUseBlockie to true', function () {
      metamaskController.setUseBlockie(true, noop);
      assert.equal(
        metamaskController.preferencesController.store.getState().useBlockie,
        true,
      );
    });
  });

  describe('#selectFirstIdentity', function () {
    let identities, address;

    beforeEach(function () {
      address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
      identities = {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          address,
          name: 'Account 1',
        },
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
          address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          name: 'Account 2',
        },
      };
      metamaskController.preferencesController.store.updateState({
        identities,
      });
      metamaskController.selectFirstIdentity();
    });

    it('changes preferences controller select address', function () {
      const preferenceControllerState = metamaskController.preferencesController.store.getState();
      assert.equal(preferenceControllerState.selectedAddress, address);
    });

    it('changes metamask controller selected address', function () {
      const metamaskState = metamaskController.getState();
      assert.equal(metamaskState.selectedAddress, address);
    });
  });

  describe('connectHardware', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.connectHardware(
          'Some random device name',
          0,
          `m/44/0'/0'`,
        );
      } catch (e) {
        assert.equal(
          e.message,
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      }
    });

    it('should add the Trezor Hardware keyring', async function () {
      sinon.spy(metamaskController.keyringController, 'addNewKeyring');
      await metamaskController.connectHardware('trezor', 0).catch(() => null);
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware',
      );
      assert.deepEqual(
        metamaskController.keyringController.addNewKeyring.getCall(0).args,
        ['Trezor Hardware'],
      );
      assert.equal(keyrings.length, 1);
    });

    it('should add the Ledger Hardware keyring', async function () {
      sinon.spy(metamaskController.keyringController, 'addNewKeyring');
      await metamaskController.connectHardware('ledger', 0).catch(() => null);
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Ledger Hardware',
      );
      assert.deepEqual(
        metamaskController.keyringController.addNewKeyring.getCall(0).args,
        ['Ledger Hardware'],
      );
      assert.equal(keyrings.length, 1);
    });
  });

  describe('checkHardwareStatus', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.checkHardwareStatus(
          'Some random device name',
          `m/44/0'/0'`,
        );
      } catch (e) {
        assert.equal(
          e.message,
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      }
    });

    it('should be locked by default', async function () {
      await metamaskController.connectHardware('trezor', 0).catch(() => null);
      const status = await metamaskController.checkHardwareStatus('trezor');
      assert.equal(status, false);
    });
  });

  describe('forgetDevice', function () {
    it('should throw if it receives an unknown device name', async function () {
      try {
        await metamaskController.forgetDevice('Some random device name');
      } catch (e) {
        assert.equal(
          e.message,
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      }
    });

    it('should wipe all the keyring info', async function () {
      await metamaskController.connectHardware('trezor', 0).catch(() => null);
      await metamaskController.forgetDevice('trezor');
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware',
      );

      assert.deepEqual(keyrings[0].accounts, []);
      assert.deepEqual(keyrings[0].page, 0);
      assert.deepEqual(keyrings[0].isUnlocked(), false);
    });
  });

  describe('unlockHardwareWalletAccount', function () {
    let accountToUnlock;
    let windowOpenStub;
    let addNewAccountStub;
    let getAccountsStub;
    beforeEach(async function () {
      accountToUnlock = 10;
      windowOpenStub = sinon.stub(window, 'open');
      windowOpenStub.returns(noop);

      addNewAccountStub = sinon.stub(
        metamaskController.keyringController,
        'addNewAccount',
      );
      addNewAccountStub.returns({});

      getAccountsStub = sinon.stub(
        metamaskController.keyringController,
        'getAccounts',
      );
      // Need to return different address to mock the behavior of
      // adding a new account from the keyring
      getAccountsStub.onCall(0).returns(Promise.resolve(['0x1']));
      getAccountsStub.onCall(1).returns(Promise.resolve(['0x2']));
      getAccountsStub.onCall(2).returns(Promise.resolve(['0x3']));
      getAccountsStub.onCall(3).returns(Promise.resolve(['0x4']));
      sinon.spy(metamaskController.preferencesController, 'setAddresses');
      sinon.spy(metamaskController.preferencesController, 'setSelectedAddress');
      sinon.spy(metamaskController.preferencesController, 'setAccountLabel');
      await metamaskController
        .connectHardware('trezor', 0, `m/44/0'/0'`)
        .catch(() => null);
      await metamaskController.unlockHardwareWalletAccount(
        accountToUnlock,
        'trezor',
        `m/44/0'/0'`,
      );
    });

    afterEach(function () {
      window.open.restore();
      metamaskController.keyringController.addNewAccount.restore();
      metamaskController.keyringController.getAccounts.restore();
      metamaskController.preferencesController.setAddresses.restore();
      metamaskController.preferencesController.setSelectedAddress.restore();
      metamaskController.preferencesController.setAccountLabel.restore();
    });

    it('should set unlockedAccount in the keyring', async function () {
      const keyrings = await metamaskController.keyringController.getKeyringsByType(
        'Trezor Hardware',
      );
      assert.equal(keyrings[0].unlockedAccount, accountToUnlock);
    });

    it('should call keyringController.addNewAccount', async function () {
      assert(metamaskController.keyringController.addNewAccount.calledOnce);
    });

    it('should call keyringController.getAccounts ', async function () {
      assert(metamaskController.keyringController.getAccounts.called);
    });

    it('should call preferencesController.setAddresses', async function () {
      assert(metamaskController.preferencesController.setAddresses.calledOnce);
    });

    it('should call preferencesController.setSelectedAddress', async function () {
      assert(
        metamaskController.preferencesController.setSelectedAddress.calledOnce,
      );
    });

    it('should call preferencesController.setAccountLabel', async function () {
      assert(
        metamaskController.preferencesController.setAccountLabel.calledOnce,
      );
    });
  });

  describe('#setCustomRpc', function () {
    it('returns custom RPC that when called', async function () {
      const rpcUrl = await metamaskController.setCustomRpc(
        CUSTOM_RPC_URL,
        CUSTOM_RPC_CHAIN_ID,
      );
      assert.equal(rpcUrl, CUSTOM_RPC_URL);
    });

    it('changes the network controller rpc', async function () {
      await metamaskController.setCustomRpc(
        CUSTOM_RPC_URL,
        CUSTOM_RPC_CHAIN_ID,
      );
      const networkControllerState = metamaskController.networkController.store.getState();
      assert.equal(networkControllerState.provider.rpcUrl, CUSTOM_RPC_URL);
    });
  });

  describe('#addNewAccount', function () {
    it('errors when an primary keyring is does not exist', async function () {
      const addNewAccount = metamaskController.addNewAccount();

      try {
        await addNewAccount;
        assert.fail('should throw');
      } catch (e) {
        assert.equal(e.message, 'MetamaskController - No HD Key Tree found');
      }
    });
  });

  describe('#verifyseedPhrase', function () {
    it('errors when no keying is provided', async function () {
      try {
        await metamaskController.verifySeedPhrase();
      } catch (error) {
        assert.equal(
          error.message,
          'MetamaskController - No HD Key Tree found',
        );
      }
    });

    beforeEach(async function () {
      await metamaskController.createNewVaultAndKeychain('password');
    });

    it('#addNewAccount', async function () {
      await metamaskController.addNewAccount();
      const getAccounts = await metamaskController.keyringController.getAccounts();
      assert.equal(getAccounts.length, 2);
    });
  });

  describe('#resetAccount', function () {
    it('wipes transactions from only the correct network id and with the selected address', async function () {
      const selectedAddressStub = sinon.stub(
        metamaskController.preferencesController,
        'getSelectedAddress',
      );
      const getNetworkstub = sinon.stub(
        metamaskController.txController.txStateManager,
        'getNetwork',
      );

      selectedAddressStub.returns('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc');
      getNetworkstub.returns(42);

      metamaskController.txController.txStateManager._addTransactionsToState([
        createTxMeta({
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
        }),
        createTxMeta({
          id: 1,
          status: TRANSACTION_STATUSES.UNAPPROVED,
          metamaskNetworkId: currentNetworkId,
          txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
        }),
        createTxMeta({
          id: 2,
          status: TRANSACTION_STATUSES.REJECTED,
          metamaskNetworkId: '32',
        }),
        createTxMeta({
          id: 3,
          status: TRANSACTION_STATUSES.SUBMITTED,
          metamaskNetworkId: currentNetworkId,
          txParams: { from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4' },
        }),
      ]);

      await metamaskController.resetAccount();
      assert.equal(
        metamaskController.txController.txStateManager.getTransaction(1),
        undefined,
      );
    });
  });

  describe('#removeAccount', function () {
    let ret;
    const addressToRemove = '0x1';

    beforeEach(async function () {
      sinon.stub(metamaskController.preferencesController, 'removeAddress');
      sinon.stub(metamaskController.accountTracker, 'removeAccount');
      sinon.stub(metamaskController.keyringController, 'removeAccount');
      sinon.stub(
        metamaskController.permissionsController,
        'removeAllAccountPermissions',
      );

      ret = await metamaskController.removeAccount(addressToRemove);
    });

    afterEach(function () {
      metamaskController.keyringController.removeAccount.restore();
      metamaskController.accountTracker.removeAccount.restore();
      metamaskController.preferencesController.removeAddress.restore();
      metamaskController.permissionsController.removeAllAccountPermissions.restore();
    });

    it('should call preferencesController.removeAddress', async function () {
      assert(
        metamaskController.preferencesController.removeAddress.calledWith(
          addressToRemove,
        ),
      );
    });
    it('should call accountTracker.removeAccount', async function () {
      assert(
        metamaskController.accountTracker.removeAccount.calledWith([
          addressToRemove,
        ]),
      );
    });
    it('should call keyringController.removeAccount', async function () {
      assert(
        metamaskController.keyringController.removeAccount.calledWith(
          addressToRemove,
        ),
      );
    });
    it('should call permissionsController.removeAllAccountPermissions', async function () {
      assert(
        metamaskController.permissionsController.removeAllAccountPermissions.calledWith(
          addressToRemove,
        ),
      );
    });
    it('should return address', async function () {
      assert.equal(ret, '0x1');
    });
  });

  describe('#setCurrentLocale', function () {
    it('checks the default currentLocale', function () {
      const preferenceCurrentLocale = metamaskController.preferencesController.store.getState()
        .currentLocale;
      assert.equal(preferenceCurrentLocale, 'en_US');
    });

    it('sets current locale in preferences controller', function () {
      metamaskController.setCurrentLocale('ja', noop);
      const preferenceCurrentLocale = metamaskController.preferencesController.store.getState()
        .currentLocale;
      assert.equal(preferenceCurrentLocale, 'ja');
    });
  });

  describe('#newUnsignedMessage', function () {
    let msgParams, metamaskMsgs, messages, msgId;

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    const data = '0x43727970746f6b697474696573';

    beforeEach(async function () {
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.callsFake(() => {
        return Promise.resolve('0x0');
      });

      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED_ALT,
      );

      msgParams = {
        from: address,
        data,
      };

      const promise = metamaskController.newUnsignedMessage(msgParams);
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop);

      metamaskMsgs = metamaskController.messageManager.getUnapprovedMsgs();
      messages = metamaskController.messageManager.messages;
      msgId = Object.keys(metamaskMsgs)[0];
      messages[0].msgParams.metamaskId = parseInt(msgId, 10);
    });

    it('persists address from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.from, address);
    });

    it('persists data from msg params', function () {
      assert.equal(metamaskMsgs[msgId].msgParams.data, data);
    });

    it('sets the status to unapproved', function () {
      assert.equal(metamaskMsgs[msgId].status, TRANSACTION_STATUSES.UNAPPROVED);
    });

    it('sets the type to eth_sign', function () {
      assert.equal(metamaskMsgs[msgId].type, 'eth_sign');
    });

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId, 10);
      metamaskController.cancelMessage(msgIdInt, noop);
      assert.equal(messages[0].status, TRANSACTION_STATUSES.REJECTED);
    });

    it('errors when signing a message', async function () {
      try {
        await metamaskController.signMessage(messages[0].msgParams);
      } catch (error) {
        assert.equal(
          error.message,
          'Expected message to be an Uint8Array with length 32',
        );
      }
    });
  });

  describe('#newUnsignedPersonalMessage', function () {
    let msgParams, metamaskPersonalMsgs, personalMessages, msgId;

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    const data = '0x43727970746f6b697474696573';

    beforeEach(async function () {
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.callsFake(() => {
        return Promise.resolve('0x0');
      });

      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED_ALT,
      );

      msgParams = {
        from: address,
        data,
      };

      const promise = metamaskController.newUnsignedPersonalMessage(msgParams);
      // handle the promise so it doesn't throw an unhandledRejection
      promise.then(noop).catch(noop);

      metamaskPersonalMsgs = metamaskController.personalMessageManager.getUnapprovedMsgs();
      personalMessages = metamaskController.personalMessageManager.messages;
      msgId = Object.keys(metamaskPersonalMsgs)[0];
      personalMessages[0].msgParams.metamaskId = parseInt(msgId, 10);
    });

    it('errors with no from in msgParams', async function () {
      try {
        await metamaskController.newUnsignedPersonalMessage({
          data,
        });
        assert.fail('should have thrown');
      } catch (error) {
        assert.equal(
          error.message,
          'MetaMask Message Signature: from field is required.',
        );
      }
    });

    it('persists address from msg params', function () {
      assert.equal(metamaskPersonalMsgs[msgId].msgParams.from, address);
    });

    it('persists data from msg params', function () {
      assert.equal(metamaskPersonalMsgs[msgId].msgParams.data, data);
    });

    it('sets the status to unapproved', function () {
      assert.equal(
        metamaskPersonalMsgs[msgId].status,
        TRANSACTION_STATUSES.UNAPPROVED,
      );
    });

    it('sets the type to personal_sign', function () {
      assert.equal(metamaskPersonalMsgs[msgId].type, 'personal_sign');
    });

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId, 10);
      metamaskController.cancelPersonalMessage(msgIdInt, noop);
      assert.equal(personalMessages[0].status, TRANSACTION_STATUSES.REJECTED);
    });

    it('errors when signing a message', async function () {
      await metamaskController.signPersonalMessage(
        personalMessages[0].msgParams,
      );
      assert.equal(
        metamaskPersonalMsgs[msgId].status,
        TRANSACTION_STATUSES.SIGNED,
      );
      assert.equal(
        metamaskPersonalMsgs[msgId].rawSig,
        '0x6a1b65e2b8ed53cf398a769fad24738f9fbe29841fe6854e226953542c4b6a173473cb152b6b1ae5f06d601d45dd699a129b0a8ca84e78b423031db5baa734741b',
      );
    });
  });

  describe('#setupUntrustedCommunication', function () {
    const mockTxParams = { from: TEST_ADDRESS };

    beforeEach(function () {
      initializeMockMiddlewareLog();
    });

    after(function () {
      tearDownMockMiddlewareLog();
    });

    it('sets up phishing stream for untrusted communication', async function () {
      const phishingMessageSender = {
        url: 'http://myethereumwalletntw.com',
        tab: {},
      };

      const { promise, resolve } = deferredPromise();
      const streamTest = createThoughStream((chunk, _, cb) => {
        if (chunk.name !== 'phishing') {
          cb();
          return;
        }
        assert.equal(
          chunk.data.hostname,
          new URL(phishingMessageSender.url).hostname,
        );
        resolve();
        cb();
      });

      metamaskController.setupUntrustedCommunication(
        streamTest,
        phishingMessageSender,
      );
      await promise;
      streamTest.end();
    });

    it('adds a tabId and origin to requests', function (done) {
      const messageSender = {
        url: 'http://mycrypto.com',
        tab: { id: 456 },
      };
      const streamTest = createThoughStream((chunk, _, cb) => {
        if (chunk.data && chunk.data.method) {
          cb(null, chunk);
          return;
        }
        cb();
      });

      metamaskController.setupUntrustedCommunication(streamTest, messageSender);

      const message = {
        id: 1999133338649204,
        jsonrpc: '2.0',
        params: [{ ...mockTxParams }],
        method: 'eth_sendTransaction',
      };
      streamTest.write(
        {
          name: 'metamask-provider',
          data: message,
        },
        null,
        () => {
          setTimeout(() => {
            assert.deepStrictEqual(loggerMiddlewareMock.requests[0], {
              ...message,
              origin: 'http://mycrypto.com',
              tabId: 456,
            });
            done();
          });
        },
      );
    });

    it('should add only origin to request if tabId not provided', function (done) {
      const messageSender = {
        url: 'http://mycrypto.com',
      };
      const streamTest = createThoughStream((chunk, _, cb) => {
        if (chunk.data && chunk.data.method) {
          cb(null, chunk);
          return;
        }
        cb();
      });

      metamaskController.setupUntrustedCommunication(streamTest, messageSender);

      const message = {
        id: 1999133338649204,
        jsonrpc: '2.0',
        params: [{ ...mockTxParams }],
        method: 'eth_sendTransaction',
      };
      streamTest.write(
        {
          name: 'metamask-provider',
          data: message,
        },
        null,
        () => {
          setTimeout(() => {
            assert.deepStrictEqual(loggerMiddlewareMock.requests[0], {
              ...message,
              origin: 'http://mycrypto.com',
            });
            done();
          });
        },
      );
    });
  });

  describe('#setupTrustedCommunication', function () {
    it('sets up controller JSON-RPC api for trusted communication', async function () {
      const messageSender = {
        url: 'http://mycrypto.com',
        tab: {},
      };
      const { promise, resolve } = deferredPromise();
      const streamTest = createThoughStream((chunk, _, cb) => {
        assert.equal(chunk.name, 'controller');
        resolve();
        cb();
      });

      metamaskController.setupTrustedCommunication(streamTest, messageSender);
      await promise;
      streamTest.end();
    });
  });

  describe('#markPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to true', function () {
      metamaskController.markPasswordForgotten(noop);
      const state = metamaskController.getState();
      assert.equal(state.forgottenPassword, true);
    });
  });

  describe('#unMarkPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to false', function () {
      metamaskController.unMarkPasswordForgotten(noop);
      const state = metamaskController.getState();
      assert.equal(state.forgottenPassword, false);
    });
  });

  describe('#_onKeyringControllerUpdate', function () {
    it('should do nothing if there are no keyrings in state', async function () {
      const syncAddresses = sinon.fake();
      const syncWithAddresses = sinon.fake();
      sandbox.replace(metamaskController, 'preferencesController', {
        syncAddresses,
      });
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      });

      const oldState = metamaskController.getState();
      await metamaskController._onKeyringControllerUpdate({ keyrings: [] });

      assert.ok(syncAddresses.notCalled);
      assert.ok(syncWithAddresses.notCalled);
      assert.deepEqual(metamaskController.getState(), oldState);
    });

    it('should sync addresses if there are keyrings in state', async function () {
      const syncAddresses = sinon.fake();
      const syncWithAddresses = sinon.fake();
      sandbox.replace(metamaskController, 'preferencesController', {
        syncAddresses,
      });
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      });

      const oldState = metamaskController.getState();
      await metamaskController._onKeyringControllerUpdate({
        keyrings: [
          {
            accounts: ['0x1', '0x2'],
          },
        ],
      });

      assert.deepEqual(syncAddresses.args, [[['0x1', '0x2']]]);
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]]);
      assert.deepEqual(metamaskController.getState(), oldState);
    });

    it('should NOT update selected address if already unlocked', async function () {
      const syncAddresses = sinon.fake();
      const syncWithAddresses = sinon.fake();
      sandbox.replace(metamaskController, 'preferencesController', {
        syncAddresses,
      });
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      });

      const oldState = metamaskController.getState();
      await metamaskController._onKeyringControllerUpdate({
        isUnlocked: true,
        keyrings: [
          {
            accounts: ['0x1', '0x2'],
          },
        ],
      });

      assert.deepEqual(syncAddresses.args, [[['0x1', '0x2']]]);
      assert.deepEqual(syncWithAddresses.args, [[['0x1', '0x2']]]);
      assert.deepEqual(metamaskController.getState(), oldState);
    });
  });
});

function deferredPromise() {
  let resolve;
  const promise = new Promise((_resolve) => {
    resolve = _resolve;
  });
  return { promise, resolve };
}
