import { strict as assert } from 'assert';
import sinon from 'sinon';
import { cloneDeep } from 'lodash';
import nock from 'nock';
import { obj as createThoughStream } from 'through2';
import EthQuery from 'eth-query';
import proxyquire from 'proxyquire';
import browser from 'webextension-polyfill';
import { wordlist as englishWordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { TransactionStatus } from '../../shared/constants/transaction';
import createTxMeta from '../../test/lib/createTxMeta';
import { NETWORK_TYPES } from '../../shared/constants/network';
import {
  HardwareDeviceNames,
  HardwareKeyringTypes,
} from '../../shared/constants/hardware-wallets';
import { deferredPromise } from './lib/util';

const Ganache = require('../../test/e2e/ganache');

const NOTIFICATION_ID = 'NHL8f2eSSTn9TKBamRLiU';

const firstTimeState = {
  config: {},
  NetworkController: {
    provider: {
      type: NETWORK_TYPES.RPC,
      rpcUrl: 'http://localhost:8545',
      chainId: '0x539',
    },
    networkDetails: {
      EIPS: {
        1559: false,
      },
    },
  },
  NotificationController: {
    notifications: {
      [NOTIFICATION_ID]: {
        id: NOTIFICATION_ID,
        origin: 'local:http://localhost:8086/',
        createdDate: 1652967897732,
        readDate: null,
        message: 'Hello, http://localhost:8086!',
      },
    },
  },
  PreferencesController: {
    disabledRpcMethodPreferences: {
      eth_sign: true,
    },
  },
};

const ganacheServer = new Ganache();

const browserPolyfillMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: () => undefined,
    },
    onMessageExternal: {
<<<<<<< HEAD
      addListener: () => undefined,
=======
      addListener: jest.fn(),
    },
    getPlatformInfo: jest.fn().mockResolvedValue('mac'),
  },
  storage: {
    session: {
      set: jest.fn(),
    },
  },
  alarms: {
    getAll: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    clear: jest.fn(),
    onAlarm: {
      addListener: jest.fn(),
>>>>>>> upstream/multichain-swaps-controller
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
  './lib/createLoggerMiddleware': { default: createLoggerMiddlewareMock },
}).default;

const currentChainId = '0x5';
const DEFAULT_LABEL = 'Account 1';
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
    globalThis.isFirstTimeProfileLoaded = true;
    await ganacheServer.start();
    sinon.spy(MetaMaskController.prototype, 'resetStates');
  });

  beforeEach(function () {
    nock('https://min-api.cryptocompare.com')
      .persist()
      .get(/.*/u)
      .reply(200, '{"JPY":12415.9}');
    nock('https://static.metafi.codefi.network')
      .persist()
      .get('/api/v1/lists/eth_phishing_detect_config.json')
      .reply(
        200,
        JSON.stringify({
          version: 2,
          tolerance: 2,
          fuzzylist: [],
          whitelist: [],
          blacklist: ['127.0.0.1'],
        }),
      )
      .get('/api/v1/lists/phishfort_hotlist.json')
      .reply(200, JSON.stringify(['127.0.0.1']));

    sandbox.replace(browser, 'runtime', {
      sendMessage: sandbox.stub().rejects(),
    });

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
      browser: browserPolyfillMock,
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

  describe('should reset states on first time profile load', function () {
    it('should reset state', function () {
      assert(metamaskController.resetStates.calledOnce);
      assert.equal(globalThis.isFirstTimeProfileLoaded, false);
    });

    it('should not reset states if already set', function () {
      // global.isFirstTime should also remain false
      assert.equal(globalThis.isFirstTimeProfileLoaded, false);
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
      const simpleKeyrings =
        metamaskController.keyringController.getKeyringsByType(
          HardwareKeyringTypes.imported,
        );
      const pubAddressHexArr = await simpleKeyrings[0].getAccounts();
      const privKeyHex = await simpleKeyrings[0].exportAccount(
        pubAddressHexArr[0],
      );
      assert.equal(privKeyHex, importPrivkey);
      assert.equal(
        pubAddressHexArr[0],
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
      );
    });

    it('adds 1 account', async function () {
      const keyringAccounts =
        await metamaskController.keyringController.getAccounts();
      assert.equal(
        keyringAccounts[keyringAccounts.length - 1],
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
      );
    });
  });

  describe('submitPassword', function () {
    it('removes any identities that do not correspond to known accounts.', async function () {
      const password = 'password';
      await metamaskController.createNewVaultAndKeychain(password);

      const fakeAddress = '0xbad0';
      metamaskController.preferencesController.addAddresses([fakeAddress]);
      await metamaskController.submitPassword(password);

      const identities = Object.keys(
        metamaskController.preferencesController.store.getState().identities,
      );
      const addresses =
        await metamaskController.keyringController.getAccounts();

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

    it('should restore any consecutive accounts with balances without extra zero balance accounts', async function () {
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
    it('getState', function () {
      const getApi = metamaskController.getApi();
      const state = getApi.getState();
      assert.deepEqual(state, metamaskController.getState());
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
      const preferenceControllerState =
        metamaskController.preferencesController.store.getState();
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
      await metamaskController
        .connectHardware(HardwareDeviceNames.trezor, 0)
        .catch(() => null);
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          HardwareKeyringTypes.trezor,
        );
      assert.deepEqual(
        metamaskController.keyringController.addNewKeyring.getCall(0).args,
        [HardwareKeyringTypes.trezor],
      );
      assert.equal(keyrings.length, 1);
    });

    it('should add the Ledger Hardware keyring', async function () {
      sinon.spy(metamaskController.keyringController, 'addNewKeyring');
      await metamaskController
        .connectHardware(HardwareDeviceNames.ledger, 0)
        .catch(() => null);
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          HardwareKeyringTypes.ledger,
        );
      assert.deepEqual(
        metamaskController.keyringController.addNewKeyring.getCall(0).args,
        [HardwareKeyringTypes.ledger],
      );
      assert.equal(keyrings.length, 1);
    });
  });

  describe('getPrimaryKeyringMnemonic', function () {
    it('should return a mnemonic as a Uint8Array', function () {
      const mockMnemonic =
        'above mercy benefit hospital call oval domain student sphere interest argue shock';
      const mnemonicIndices = mockMnemonic
        .split(' ')
        .map((word) => englishWordlist.indexOf(word));
      const uint8ArrayMnemonic = new Uint8Array(
        new Uint16Array(mnemonicIndices).buffer,
      );

      const mockHDKeyring = {
        type: 'HD Key Tree',
        mnemonic: uint8ArrayMnemonic,
      };
      sinon
        .stub(metamaskController.keyringController, 'getKeyringsByType')
        .returns([mockHDKeyring]);

      const recoveredMnemonic = metamaskController.getPrimaryKeyringMnemonic();

      assert.equal(recoveredMnemonic, uint8ArrayMnemonic);
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

<<<<<<< HEAD
    it('should be locked by default', async function () {
      await metamaskController
        .connectHardware(HardwareDeviceNames.trezor, 0)
        .catch(() => null);
      const status = await metamaskController.checkHardwareStatus(
        HardwareDeviceNames.trezor,
      );
      assert.equal(status, false);
=======
    describe('forgetDevice', () => {
      it('should throw if it receives an unknown device name', async () => {
        const result = metamaskController.forgetDevice(
          'Some random device name',
        );
        await expect(result).rejects.toThrow(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      });

      it('should wipe all the keyring info', async () => {
        await metamaskController
          .connectHardware(HardwareDeviceNames.trezor, 0)
          .catch(() => null);
        await metamaskController.forgetDevice(HardwareDeviceNames.trezor);
        const keyrings =
          await metamaskController.keyringController.getKeyringsByType(
            KeyringType.trezor,
          );

        expect(keyrings[0].accounts).toStrictEqual([]);
        expect(keyrings[0].page).toStrictEqual(0);
        expect(keyrings[0].isUnlocked()).toStrictEqual(false);
      });
    });

    describe('unlockHardwareWalletAccount', () => {
      const accountToUnlock = 10;
      beforeEach(async () => {
        await metamaskController.keyringController.createNewVaultAndRestore(
          'password',
          TEST_SEED,
        );
        jest.spyOn(window, 'open').mockReturnValue();
        jest
          .spyOn(
            metamaskController.keyringController,
            'addNewAccountForKeyring',
          )
          .mockReturnValue('0x123');

        jest
          .spyOn(metamaskController.keyringController, 'getAccounts')
          .mockResolvedValueOnce(['0x1'])
          .mockResolvedValueOnce(['0x2'])
          .mockResolvedValueOnce(['0x3']);
        jest
          .spyOn(metamaskController.preferencesController, 'setAddresses')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.preferencesController, 'setSelectedAddress')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.preferencesController, 'setAccountLabel')
          .mockReturnValue();

        await metamaskController.unlockHardwareWalletAccount(
          accountToUnlock,
          HardwareDeviceNames.trezor,
          `m/44'/1'/0'/0`,
        );
      });

      it('should set unlockedAccount in the keyring', async () => {
        const keyrings =
          await metamaskController.keyringController.getKeyringsByType(
            KeyringType.trezor,
          );
        expect(keyrings[0].unlockedAccount).toStrictEqual(accountToUnlock);
      });

      it('should call keyringController.addNewAccount', async () => {
        expect(
          metamaskController.keyringController.addNewAccountForKeyring,
        ).toHaveBeenCalledTimes(1);
      });

      it('should call keyringController.getAccounts', async () => {
        expect(
          metamaskController.keyringController.getAccounts,
        ).toHaveBeenCalledTimes(2);
      });

      it('should call preferencesController.setAddresses', async () => {
        expect(
          metamaskController.preferencesController.setAddresses,
        ).toHaveBeenCalledTimes(1);
      });

      it('should call preferencesController.setSelectedAddress', async () => {
        expect(
          metamaskController.preferencesController.setSelectedAddress,
        ).toHaveBeenCalledTimes(1);
      });

      it('should call preferencesController.setAccountLabel', async () => {
        expect(
          metamaskController.preferencesController.setAccountLabel,
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('#addNewAccount', () => {
      it('errors when an primary keyring is does not exist', async () => {
        const addNewAccount = metamaskController.addNewAccount();

        await expect(addNewAccount).rejects.toThrow('No HD keyring found');
      });
    });

    describe('#verifyseedPhrase', () => {
      it('errors when no keying is provided', async () => {
        await expect(metamaskController.verifySeedPhrase()).rejects.toThrow(
          'No HD keyring found',
        );
      });

      it('#addNewAccount', async () => {
        await metamaskController.createNewVaultAndKeychain('password');
        await metamaskController.addNewAccount(1);
        const getAccounts =
          await metamaskController.keyringController.getAccounts();
        expect(getAccounts).toHaveLength(2);
      });
    });

    describe('#resetAccount', () => {
      it('wipes transactions from only the correct chain id and with the selected address', async function () {
        jest
          .spyOn(metamaskController.preferencesController, 'getSelectedAddress')
          .mockReturnValue('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc');

        metamaskController.txController.txStateManager._addTransactionsToState([
          createTxMeta({
            id: 1,
            status: TransactionStatus.unapproved,
            chainId: currentChainId,
            txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
          }),
          createTxMeta({
            id: 1,
            status: TransactionStatus.unapproved,
            chainId: currentChainId,
            txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
          }),
          createTxMeta({
            id: 2,
            status: TransactionStatus.rejected,
            chainId: '0x32',
          }),
          createTxMeta({
            id: 3,
            status: TransactionStatus.submitted,
            chainId: currentChainId,
            txParams: { from: '0xB09d8505E1F4EF1CeA089D47094f5DD3464083d4' },
          }),
        ]);

        await metamaskController.resetAccount();

        expect(
          metamaskController.txController.txStateManager.getTransaction(1),
        ).toBeUndefined();
      });
    });

    describe('#removeAccount', () => {
      let ret;
      const addressToRemove = '0x1';
      let mockKeyring;

      beforeEach(async () => {
        mockKeyring = {
          getAccounts: jest.fn().mockResolvedValue([]),
          destroy: jest.fn(),
        };
        jest
          .spyOn(metamaskController.keyringController, 'removeAccount')
          .mockReturnValue();
        jest
          .spyOn(metamaskController, 'removeAllAccountPermissions')
          .mockReturnValue();

        jest
          .spyOn(metamaskController.keyringController, 'getKeyringForAccount')
          .mockResolvedValue(mockKeyring);

        ret = await metamaskController.removeAccount(addressToRemove);
      });

      it('should call keyringController.removeAccount', async () => {
        expect(
          metamaskController.keyringController.removeAccount,
        ).toHaveBeenCalledWith(addressToRemove);
      });
      it('should call metamaskController.removeAllAccountPermissions', async () => {
        expect(
          metamaskController.removeAllAccountPermissions,
        ).toHaveBeenCalledWith(addressToRemove);
      });
      it('should return address', async () => {
        expect(ret).toStrictEqual('0x1');
      });
      it('should call keyringController.getKeyringForAccount', async () => {
        expect(
          metamaskController.keyringController.getKeyringForAccount,
        ).toHaveBeenCalledWith(addressToRemove);
      });
      it('should call keyring.destroy', async () => {
        expect(mockKeyring.destroy).toHaveBeenCalledTimes(1);
      });
    });

    describe('#setupUntrustedCommunication', () => {
      const mockTxParams = { from: TEST_ADDRESS };

      beforeEach(() => {
        initializeMockMiddlewareLog();
      });

      afterAll(() => {
        tearDownMockMiddlewareLog();
      });

      it('sets up phishing stream for untrusted communication', async () => {
        const phishingMessageSender = {
          url: 'http://test.metamask-phishing.io',
          tab: {},
        };

        const { promise, resolve } = deferredPromise();
        const streamTest = createThoughStream((chunk, _, cb) => {
          if (chunk.name !== 'phishing') {
            cb();
            return;
          }
          expect(chunk.data.hostname).toStrictEqual(
            new URL(phishingMessageSender.url).hostname,
          );
          resolve();
          cb();
        });

        metamaskController.setupUntrustedCommunication({
          connectionStream: streamTest,
          sender: phishingMessageSender,
        });
        await promise;
        streamTest.end();
      });

      it('adds a tabId, origin and networkClient to requests', async () => {
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

        metamaskController.setupUntrustedCommunication({
          connectionStream: streamTest,
          sender: messageSender,
        });

        const message = {
          id: 1999133338649204,
          jsonrpc: '2.0',
          params: [{ ...mockTxParams }],
          method: 'eth_sendTransaction',
        };
        await new Promise((resolve) => {
          streamTest.write(
            {
              name: 'metamask-provider',
              data: message,
            },
            null,
            () => {
              setTimeout(() => {
                expect(loggerMiddlewareMock.requests[0]).toHaveProperty(
                  'origin',
                  'http://mycrypto.com',
                );
                expect(loggerMiddlewareMock.requests[0]).toHaveProperty(
                  'tabId',
                  456,
                );
                expect(loggerMiddlewareMock.requests[0]).toHaveProperty(
                  'networkClientId',
                  'networkConfigurationId1',
                );
                resolve();
              });
            },
          );
        });
      });

      it('should add only origin to request if tabId not provided', async () => {
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

        metamaskController.setupUntrustedCommunication({
          connectionStream: streamTest,
          sender: messageSender,
        });

        const message = {
          id: 1999133338649204,
          jsonrpc: '2.0',
          params: [{ ...mockTxParams }],
          method: 'eth_sendTransaction',
        };
        await new Promise((resolve) => {
          streamTest.write(
            {
              name: 'metamask-provider',
              data: message,
            },
            null,
            () => {
              setTimeout(() => {
                expect(loggerMiddlewareMock.requests[0]).not.toHaveProperty(
                  'tabId',
                );
                expect(loggerMiddlewareMock.requests[0]).toHaveProperty(
                  'origin',
                  'http://mycrypto.com',
                );
                resolve();
              });
            },
          );
        });
      });
    });

    describe('#setupTrustedCommunication', () => {
      it('sets up controller JSON-RPC api for trusted communication', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
          tab: {},
        };
        const { promise, resolve } = deferredPromise();
        const streamTest = createThoughStream((chunk, _, cb) => {
          expect(chunk.name).toStrictEqual('controller');
          resolve();
          cb();
        });

        metamaskController.setupTrustedCommunication(streamTest, messageSender);
        await promise;
        streamTest.end();
      });
    });

    describe('#markPasswordForgotten', () => {
      it('adds and sets forgottenPassword to config data to true', () => {
        metamaskController.markPasswordForgotten(noop);
        const state = metamaskController.getState();
        expect(state.forgottenPassword).toStrictEqual(true);
      });
    });

    describe('#unMarkPasswordForgotten', () => {
      it('adds and sets forgottenPassword to config data to false', () => {
        metamaskController.unMarkPasswordForgotten(noop);
        const state = metamaskController.getState();
        expect(state.forgottenPassword).toStrictEqual(false);
      });
    });

    describe('#_onKeyringControllerUpdate', () => {
      it('should do nothing if there are no keyrings in state', async () => {
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({ keyrings: [] });

        expect(
          metamaskController.preferencesController.syncAddresses,
        ).not.toHaveBeenCalled();
        expect(
          metamaskController.accountTracker.syncWithAddresses,
        ).not.toHaveBeenCalled();
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });

      it('should sync addresses if there are keyrings in state', async () => {
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          keyrings: [
            {
              accounts: ['0x1', '0x2'],
            },
          ],
        });

        expect(
          metamaskController.preferencesController.syncAddresses,
        ).toHaveBeenCalledWith(['0x1', '0x2']);
        expect(
          metamaskController.accountTracker.syncWithAddresses,
        ).toHaveBeenCalledWith(['0x1', '0x2']);
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });

      it('should NOT update selected address if already unlocked', async () => {
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockReturnValue();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          isUnlocked: true,
          keyrings: [
            {
              accounts: ['0x1', '0x2'],
            },
          ],
        });

        expect(
          metamaskController.preferencesController.syncAddresses,
        ).toHaveBeenCalledWith(['0x1', '0x2']);
        expect(
          metamaskController.accountTracker.syncWithAddresses,
        ).toHaveBeenCalledWith(['0x1', '0x2']);
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });
    });

    describe('markNotificationsAsRead', () => {
      it('marks the notification as read', () => {
        metamaskController.markNotificationsAsRead([NOTIFICATION_ID]);
        const readNotification =
          metamaskController.getState().notifications[NOTIFICATION_ID];
        expect(readNotification.readDate).not.toBeNull();
      });
    });

    describe('dismissNotifications', () => {
      it('deletes the notification from state', () => {
        metamaskController.dismissNotifications([NOTIFICATION_ID]);
        const state = metamaskController.getState().notifications;
        expect(Object.values(state)).not.toContain(NOTIFICATION_ID);
      });
    });

    describe('getTokenStandardAndDetails', () => {
      it('gets token data from the token list if available, and with a balance retrieved by fetchTokenBalance', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        const tokenData = {
          decimals: 18,
          symbol: 'DAI',
        };

        metamaskController.tokenListController.update(() => {
          return {
            tokenList: {
              '0x6b175474e89094c44da98b954eedeac495271d0f': tokenData,
            },
          };
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from tokens if available, and with a balance retrieved by fetchTokenBalance', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        const tokenData = {
          decimals: 18,
          symbol: 'DAI',
        };

        metamaskController.tokensController.update({
          tokens: [
            {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              ...tokenData,
            },
          ],
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from contract-metadata if available, and with a balance retrieved by fetchTokenBalance', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual('18');
        expect(tokenDetails.symbol).toStrictEqual('DAI');
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from the blockchain, via the assetsContractController, if not available through other sources', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        const tokenData = {
          standard: 'ERC20',
          decimals: 18,
          symbol: 'DAI',
          balance: '333',
        };

        metamaskController.tokenListController.update(() => {
          return {
            tokenList: {
              '0x6b175474e89094c44da98b954eedeac495271d0f': {},
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockReturnValue(tokenData);

        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0xNotInTokenList',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(tokenDetails.standard).toStrictEqual(
          tokenData.standard.toUpperCase(),
        );
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual(tokenData.balance);
      });

      it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC721', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        const tokenData = {
          standard: 'ERC721',
          decimals: 18,
          symbol: 'DAI',
          balance: '333',
        };

        metamaskController.tokenListController.update(() => {
          return {
            tokenList: {
              '0xaaa75474e89094c44da98b954eedeac495271d0f': tokenData,
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockReturnValue(tokenData);

        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0xAAA75474e89094c44da98b954eedeac495271d0f',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(tokenDetails.standard).toStrictEqual(
          tokenData.standard.toUpperCase(),
        );
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual(tokenData.balance);
      });

      it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC1155', async () => {
        const providerResultStub = {
          eth_getCode: '0x123',
          eth_call:
            '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
        };
        const { provider } = createTestProviderTools({
          scaffold: providerResultStub,
          networkId: '5',
          chainId: '5',
        });

        const tokenData = {
          standard: 'ERC1155',
          decimals: 18,
          symbol: 'DAI',
          balance: '333',
        };

        metamaskController.tokenListController.update(() => {
          return {
            tokenList: {
              '0xaaa75474e89094c44da98b954eedeac495271d0f': tokenData,
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockReturnValue(tokenData);

        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0xAAA75474e89094c44da98b954eedeac495271d0f',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );
        expect(tokenDetails.standard).toStrictEqual(
          tokenData.standard.toUpperCase(),
        );
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual(tokenData.balance);
      });

      describe('findNetworkConfigurationBy', () => {
        it('returns null if passed an object containing a valid networkConfiguration key but no matching value is found', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              chainId: '0xnone',
            }),
          ).toStrictEqual(null);
        });
        it('returns null if passed an object containing an invalid networkConfiguration key', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              invalidKey: '0xnone',
            }),
          ).toStrictEqual(null);
        });

        it('returns matching networkConfiguration when passed a chainId that matches an existing configuration', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              chainId: MAINNET_CHAIN_ID,
            }),
          ).toStrictEqual({
            chainId: MAINNET_CHAIN_ID,
            nickname: 'Alt Mainnet',
            id: NETWORK_CONFIGURATION_ID_1,
            rpcUrl: ALT_MAINNET_RPC_URL,
            ticker: ETH,
            type: NETWORK_TYPES.RPC,
          });
        });

        it('returns matching networkConfiguration when passed a ticker that matches an existing configuration', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              ticker: MATIC,
            }),
          ).toStrictEqual({
            rpcUrl: POLYGON_RPC_URL,
            type: NETWORK_TYPES.RPC,
            chainId: POLYGON_CHAIN_ID,
            ticker: MATIC,
            nickname: 'Polygon',
            id: NETWORK_CONFIGURATION_ID_2,
          });
        });

        it('returns matching networkConfiguration when passed a nickname that matches an existing configuration', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              nickname: 'Alt Mainnet',
            }),
          ).toStrictEqual({
            chainId: MAINNET_CHAIN_ID,
            nickname: 'Alt Mainnet',
            id: NETWORK_CONFIGURATION_ID_1,
            rpcUrl: ALT_MAINNET_RPC_URL,
            ticker: ETH,
            type: NETWORK_TYPES.RPC,
          });
        });

        it('returns null if passed an object containing mismatched networkConfiguration key/value combination', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              nickname: MAINNET_CHAIN_ID,
            }),
          ).toStrictEqual(null);
        });

        it('returns the first networkConfiguration added if passed an key/value combination for which there are multiple matching configurations', () => {
          expect(
            metamaskController.findNetworkConfigurationBy({
              chainId: POLYGON_CHAIN_ID,
            }),
          ).toStrictEqual({
            rpcUrl: POLYGON_RPC_URL,
            type: NETWORK_TYPES.RPC,
            chainId: POLYGON_CHAIN_ID,
            ticker: MATIC,
            nickname: 'Polygon',
            id: NETWORK_CONFIGURATION_ID_2,
          });
        });
      });
    });

    describe('incoming transactions', () => {
      it('starts incoming transaction polling if incomingTransactionsPreferences is enabled for that chainId', async () => {
        expect(
          TransactionController.prototype.startIncomingTransactionPolling,
        ).not.toHaveBeenCalled();

        await metamaskController.preferencesController.store.subscribe.mock.lastCall[0](
          {
            incomingTransactionsPreferences: {
              [MAINNET_CHAIN_ID]: true,
            },
          },
        );

        expect(
          TransactionController.prototype.startIncomingTransactionPolling,
        ).toHaveBeenCalledTimes(1);
      });

      it('stops incoming transaction polling if incomingTransactionsPreferences is disabled for that chainId', async () => {
        expect(
          TransactionController.prototype.stopIncomingTransactionPolling,
        ).not.toHaveBeenCalled();

        await metamaskController.preferencesController.store.subscribe.mock.lastCall[0](
          {
            incomingTransactionsPreferences: {
              [MAINNET_CHAIN_ID]: false,
            },
          },
        );

        expect(
          TransactionController.prototype.stopIncomingTransactionPolling,
        ).toHaveBeenCalledTimes(1);
      });

      it('updates incoming transactions when changing account', async () => {
        expect(
          TransactionController.prototype.updateIncomingTransactions,
        ).not.toHaveBeenCalled();

        await metamaskController.preferencesController.store.subscribe.mock.lastCall[0](
          {
            selectedAddress: 'foo',
          },
        );

        expect(
          TransactionController.prototype.updateIncomingTransactions,
        ).toHaveBeenCalledTimes(1);
      });

      it('updates incoming transactions when changing network', async () => {
        expect(
          TransactionController.prototype.updateIncomingTransactions,
        ).not.toHaveBeenCalled();

        await ControllerMessenger.prototype.subscribe.mock.calls
          .filter((args) => args[0] === 'NetworkController:networkDidChange')
          .slice(-1)[0][1]();

        expect(
          TransactionController.prototype.updateIncomingTransactions,
        ).toHaveBeenCalledTimes(1);
      });
>>>>>>> upstream/multichain-swaps-controller
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
      await metamaskController
        .connectHardware(HardwareDeviceNames.trezor, 0)
        .catch(() => null);
      await metamaskController.forgetDevice(HardwareDeviceNames.trezor);
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          HardwareKeyringTypes.trezor,
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
        .connectHardware(HardwareDeviceNames.trezor, 0, `m/44'/1'/0'/0`)
        .catch(() => null);
      await metamaskController.unlockHardwareWalletAccount(
        accountToUnlock,
        HardwareDeviceNames.trezor,
        `m/44'/1'/0'/0`,
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
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          HardwareKeyringTypes.trezor,
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
      const networkControllerState =
        metamaskController.networkController.store.getState();
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

    it('#addNewAccount', async function () {
      await metamaskController.createNewVaultAndKeychain('password');
      await metamaskController.addNewAccount(1);
      const getAccounts =
        await metamaskController.keyringController.getAccounts();
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
        'getNetworkState',
      );

      selectedAddressStub.returns('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc');
      getNetworkstub.returns(42);

      metamaskController.txController.txStateManager._addTransactionsToState([
        createTxMeta({
          id: 1,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
        }),
        createTxMeta({
          id: 1,
          status: TransactionStatus.unapproved,
          metamaskNetworkId: currentNetworkId,
          txParams: { from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc' },
        }),
        createTxMeta({
          id: 2,
          status: TransactionStatus.rejected,
          metamaskNetworkId: '32',
        }),
        createTxMeta({
          id: 3,
          status: TransactionStatus.submitted,
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
    let mockKeyring;

    beforeEach(async function () {
      mockKeyring = {
        getAccounts: sinon.stub().returns(Promise.resolve([])),
        destroy: sinon.stub(),
      };
      sinon.stub(metamaskController.preferencesController, 'removeAddress');
      sinon.stub(metamaskController.accountTracker, 'removeAccount');
      sinon.stub(metamaskController.keyringController, 'removeAccount');
      sinon.stub(metamaskController, 'removeAllAccountPermissions');
      sinon
        .stub(metamaskController.keyringController, 'getKeyringForAccount')
        .returns(Promise.resolve(mockKeyring));

      ret = await metamaskController.removeAccount(addressToRemove);
    });

    afterEach(function () {
      metamaskController.keyringController.removeAccount.restore();
      metamaskController.accountTracker.removeAccount.restore();
      metamaskController.preferencesController.removeAddress.restore();
      metamaskController.removeAllAccountPermissions.restore();

      mockKeyring.getAccounts.resetHistory();
      mockKeyring.destroy.resetHistory();
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
    it('should call metamaskController.removeAllAccountPermissions', async function () {
      assert(
        metamaskController.removeAllAccountPermissions.calledWith(
          addressToRemove,
        ),
      );
    });
    it('should return address', async function () {
      assert.equal(ret, '0x1');
    });
    it('should call keyringController.getKeyringForAccount', async function () {
      assert(
        metamaskController.keyringController.getKeyringForAccount.calledWith(
          addressToRemove,
        ),
      );
    });
    it('should call keyring.destroy', async function () {
      assert(mockKeyring.destroy.calledOnce);
    });
  });

  describe('#newUnsignedMessage', function () {
    let msgParams, metamaskMsgs, messages, msgId;

    const address = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
    const data =
      '0x0000000000000000000000000000000000000043727970746f6b697474696573';

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
      assert.equal(metamaskMsgs[msgId].status, TransactionStatus.unapproved);
    });

    it('sets the type to eth_sign', function () {
      assert.equal(metamaskMsgs[msgId].type, 'eth_sign');
    });

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId, 10);
      metamaskController.cancelMessage(msgIdInt, noop);
      assert.equal(messages[0].status, TransactionStatus.rejected);
    });

    it('checks message length', async function () {
      msgParams = {
        from: address,
        data: '0xDEADBEEF',
      };

      try {
        await metamaskController.newUnsignedMessage(msgParams);
      } catch (error) {
        assert.equal(error.message, 'eth_sign requires 32 byte message hash');
      }
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

      metamaskPersonalMsgs =
        metamaskController.personalMessageManager.getUnapprovedMsgs();
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
        TransactionStatus.unapproved,
      );
    });

    it('sets the type to personal_sign', function () {
      assert.equal(metamaskPersonalMsgs[msgId].type, 'personal_sign');
    });

    it('rejects the message', function () {
      const msgIdInt = parseInt(msgId, 10);
      metamaskController.cancelPersonalMessage(msgIdInt, noop);
      assert.equal(personalMessages[0].status, TransactionStatus.rejected);
    });

    it('errors when signing a message', async function () {
      await metamaskController.signPersonalMessage(
        personalMessages[0].msgParams,
      );
      assert.equal(
        metamaskPersonalMsgs[msgId].status,
        TransactionStatus.signed,
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

      metamaskController.setupUntrustedCommunication({
        connectionStream: streamTest,
        sender: phishingMessageSender,
      });
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

      metamaskController.setupUntrustedCommunication({
        connectionStream: streamTest,
        sender: messageSender,
      });

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

      metamaskController.setupUntrustedCommunication({
        connectionStream: streamTest,
        sender: messageSender,
      });

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

  describe('markNotificationsAsRead', function () {
    it('marks the notification as read', function () {
      metamaskController.markNotificationsAsRead([NOTIFICATION_ID]);
      const readNotification =
        metamaskController.getState().notifications[NOTIFICATION_ID];
      assert.notEqual(readNotification.readDate, null);
    });
  });

  describe('dismissNotifications', function () {
    it('deletes the notification from state', function () {
      metamaskController.dismissNotifications([NOTIFICATION_ID]);
      const state = metamaskController.getState().notifications;
      assert.ok(
        !Object.values(state).includes(NOTIFICATION_ID),
        'Object should not include the deleted notification',
      );
    });
  });
});
