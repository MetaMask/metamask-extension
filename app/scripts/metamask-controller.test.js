import { cloneDeep, last } from 'lodash';
import nock from 'nock';
import { obj as createThoughStream } from 'through2';
import EthQuery from 'eth-query';
import browser from 'webextension-polyfill';
import { wordlist as englishWordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { TransactionStatus } from '../../shared/constants/transaction';
import createTxMeta from '../../test/lib/createTxMeta';
import { NETWORK_TYPES } from '../../shared/constants/network';
import { createTestProviderTools } from '../../test/stub/provider';
import {
  HardwareDeviceNames,
  HardwareKeyringType,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { deferredPromise } from './lib/util';

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
  storage: {
    session: {},
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

const MOCK_TOKEN_BALANCE = '888';

function MockEthContract() {
  return () => {
    return {
      at: () => {
        return {
          balanceOf: () => MOCK_TOKEN_BALANCE,
        };
      },
    };
  };
}

jest.mock('./lib/createLoggerMiddleware', () => ({
  default: createLoggerMiddlewareMock,
}));

jest.mock('ethjs-contract', () => MockEthContract);

// TODO, Feb 24, 2023:
// ethjs-contract is being added to proxyquire, but we might want to discontinue proxyquire
// this is for expediency as we resolve a bug for v10.26.0. The proper solution here would have
// us set up the test infrastructure for a mocked provider. Github ticket for that is:
// https://github.com/MetaMask/metamask-extension/issues/17890
const MetaMaskController = require('./metamask-controller').default;

const MetaMaskControllerMV3 = proxyquire('./metamask-controller', {
  '../../shared/modules/mv3.utils': { isManifestV3: true },
}).default;

const currentNetworkId = '5';
const DEFAULT_LABEL = 'Account 1';
const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const TEST_SEED_ALT =
  'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';

const NOTIFICATION_ID = 'NHL8f2eSSTn9TKBamRLiU';

const ALT_MAINNET_RPC_URL = 'http://localhost:8545';
const POLYGON_RPC_URL = 'https://polygon.llamarpc.com';
const POLYGON_RPC_URL_2 = 'https://polygon-rpc.com';

const NETWORK_CONFIGURATION_ID_1 = 'networkConfigurationId1';
const NETWORK_CONFIGURATION_ID_2 = 'networkConfigurationId2';
const NETWORK_CONFIGURATION_ID_3 = 'networkConfigurationId3';

const ETH = 'ETH';
const MATIC = 'MATIC';

const POLYGON_CHAIN_ID = '0x89';
const MAINNET_CHAIN_ID = '0x1';

const firstTimeState = {
  config: {},
  NetworkController: {
    providerConfig: {
      type: NETWORK_TYPES.RPC,
      rpcUrl: ALT_MAINNET_RPC_URL,
      chainId: MAINNET_CHAIN_ID,
      ticker: ETH,
      nickname: 'Alt Mainnet',
      id: NETWORK_CONFIGURATION_ID_1,
    },
    networkConfigurations: {
      [NETWORK_CONFIGURATION_ID_1]: {
        rpcUrl: ALT_MAINNET_RPC_URL,
        type: NETWORK_TYPES.RPC,
        chainId: MAINNET_CHAIN_ID,
        ticker: ETH,
        nickname: 'Alt Mainnet',
        id: NETWORK_CONFIGURATION_ID_1,
      },
      [NETWORK_CONFIGURATION_ID_2]: {
        rpcUrl: POLYGON_RPC_URL,
        type: NETWORK_TYPES.RPC,
        chainId: POLYGON_CHAIN_ID,
        ticker: MATIC,
        nickname: 'Polygon',
        id: NETWORK_CONFIGURATION_ID_2,
      },
      [NETWORK_CONFIGURATION_ID_3]: {
        rpcUrl: POLYGON_RPC_URL_2,
        type: NETWORK_TYPES.RPC,
        chainId: POLYGON_CHAIN_ID,
        ticker: MATIC,
        nickname: 'Alt Polygon',
        id: NETWORK_CONFIGURATION_ID_1,
      },
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
};

describe('MetaMaskController', function () {
  let metamaskController;

  const sandbox = sinon.createSandbox();
  const noop = () => undefined;

  browserPolyfillMock.storage.session.set = sandbox.spy();

  beforeAll(async function () {
    globalThis.isFirstTimeProfileLoaded = true;
    await ganacheServer.start();
    jest.spyOn(MetaMaskController.prototype, 'resetStates').mockClear();
    jest.spyOn(MetaMaskControllerMV3.prototype, 'resetStates').mockClear();
  });

  beforeEach(function () {
    nock('https://min-api.cryptocompare.com')
      .persist()
      .get(/.*/u)
      .reply(200, '{"JPY":12415.9}');
    nock('https://static.metafi.codefi.network')
      .persist()
      .get('/api/v1/lists/stalelist.json')
      .reply(
        200,
        JSON.stringify({
          version: 2,
          tolerance: 2,
          fuzzylist: [],
          allowlist: [],
          blocklist: ['127.0.0.1'],
          lastUpdated: 0,
        }),
      )
      .get('/api/v1/lists/hotlist.json')
      .reply(
        200,
        JSON.stringify([
          { url: '127.0.0.1', targetList: 'blocklist', timestamp: 0 },
        ]),
      );

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
      isFirstMetaMaskControllerSetup: true,
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
    sandbox.mockRestore();
  });

  afterAll(async function () {
    await ganacheServer.quit();
  });

  describe('should reset states on first time profile load', function () {
    it('in mv2, it should reset state without attempting to call browser storage', function () {
      expect(metamaskController.resetStates.callCount).toStrictEqual(1);
      expect(browserPolyfillMock.storage.session.set.callCount).toStrictEqual(
        0,
      );
    });

    it('in mv3, it should reset state', function () {
      MetaMaskControllerMV3.prototype.resetStates.mockReset();
      const metamaskControllerMV3 = new MetaMaskControllerMV3({
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
        isFirstMetaMaskControllerSetup: true,
      });
      expect(metamaskControllerMV3.resetStates.callCount).toStrictEqual(1);
      expect(browserPolyfillMock.storage.session.set.callCount).toStrictEqual(
        1,
      );
      expect(
        browserPolyfillMock.storage.session.set.mock.calls[0][0],
      ).toStrictEqual({
        isFirstMetaMaskControllerSetup: false,
      });
    });

    it('in mv3, it should not reset states if isFirstMetaMaskControllerSetup is false', function () {
      MetaMaskControllerMV3.prototype.resetStates.mockReset();
      browserPolyfillMock.storage.session.set.mockReset();
      const metamaskControllerMV3 = new MetaMaskControllerMV3({
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
        isFirstMetaMaskControllerSetup: false,
      });
      expect(metamaskControllerMV3.resetStates.callCount).toStrictEqual(0);
      expect(browserPolyfillMock.storage.session.set.callCount).toStrictEqual(
        0,
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
      const simpleKeyrings =
        metamaskController.keyringController.getKeyringsByType(
          KeyringType.imported,
        );
      const pubAddressHexArr = await simpleKeyrings[0].getAccounts();
      const privKeyHex = await simpleKeyrings[0].exportAccount(
        pubAddressHexArr[0],
      );
      expect(privKeyHex).toStrictEqual(importPrivkey);
      expect(pubAddressHexArr[0]).toStrictEqual(
        '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
      );
    });

    it('adds 1 account', async function () {
      const keyringAccounts =
        await metamaskController.keyringController.getAccounts();
      expect(last(keyringAccounts)).toStrictEqual(
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
        expect(addresses).toContain(identity);
      });

      addresses.forEach((address) => {
        expect(identities).toContain(address);
      });
    });
  });

  const FAKE_HEX_BALANCE = '0x14ced5122ce0a000';

  describe('#createNewVaultAndKeychain', function () {
    it('can only create new vault on keyringController once', async function () {
      const selectStub = sandbox.stub(
        metamaskController,
        'selectFirstIdentity',
      );

      const password = 'a-fake-password';

      await metamaskController.createNewVaultAndKeychain(password);
      await metamaskController.createNewVaultAndKeychain(password);

      expect(
        metamaskController.keyringController.createNewVaultAndKeychain,
      ).toHaveBeenCalledTimes(1);

      selectStub.mockReset();
    });
  });

  describe('#createNewVaultAndRestore', function () {
    const expectWithinRange = (time, [start, end]) => {
      expect(time).toBeGreaterThanOrEqual(start);
      expect(time).toBeLessThanOrEqual(end);
    };

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

      expect(
        metamaskController.keyringController.createNewVaultAndRestore,
      ).toHaveBeenCalledTimes(2);
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
      expectWithinRange(firstVaultIdentities[TEST_ADDRESS].lastSelected, [
        startTime,
        endTime,
      ]);

      delete firstVaultIdentities[TEST_ADDRESS].lastSelected;
      expect(firstVaultIdentities).toStrictEqual({
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
      expect(labelledFirstVaultIdentities).toStrictEqual({
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

      expectWithinRange(secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected, [
        startTime,
        endTime,
      ]);

      delete secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected;
      expect(secondVaultIdentities).toStrictEqual({
        [TEST_ADDRESS_ALT]: { address: TEST_ADDRESS_ALT, name: DEFAULT_LABEL },
      });
    });

    it('should restore any consecutive accounts with balances without extra zero balance accounts', async function () {
      sandbox.stub(metamaskController, 'getBalance');
      metamaskController.getBalance.withArgs(TEST_ADDRESS).callsFake(() => {
        return Promise.resolve(FAKE_HEX_BALANCE);
      });
      metamaskController.getBalance.withArgs(TEST_ADDRESS_2).callsFake(() => {
        return Promise.resolve('0x0');
      });
      metamaskController.getBalance.withArgs(TEST_ADDRESS_3).callsFake(() => {
        return Promise.resolve(FAKE_HEX_BALANCE);
      });

      const startTime = Date.now();
      await metamaskController.createNewVaultAndRestore(
        'foobar1337',
        TEST_SEED,
      );

      const identities = cloneDeep(metamaskController.getState().identities);
      expectWithinRange(identities[TEST_ADDRESS].lastSelected, [
        startTime,
        Date.now(),
      ]);
      delete identities[TEST_ADDRESS].lastSelected;
      expect(identities).toStrictEqual({
        [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
      });
    });
  });

  describe('#getBalance', function () {
    it('should return the balance known by accountTracker', async function () {
      const accounts = {};

      accounts[TEST_ADDRESS] = { balance: FAKE_HEX_BALANCE };

      metamaskController.accountTracker.store.putState({ accounts });

      const gotten = await metamaskController.getBalance(TEST_ADDRESS);

      expect(FAKE_HEX_BALANCE).toStrictEqual(gotten);
    });

    it('should ask the network for a balance when not known by accountTracker', async function () {
      const accounts = {};

      const ethQuery = new EthQuery();
      jest
        .spyOn(ethQuery, 'getBalance')
        .mockClear()
        .mockImplementation((_, callback) => {
          callback(undefined, FAKE_HEX_BALANCE);
        });

      metamaskController.accountTracker.store.putState({ accounts });

      const gotten = await metamaskController.getBalance(
        TEST_ADDRESS,
        ethQuery,
      );

      expect(FAKE_HEX_BALANCE).toStrictEqual(gotten);
    });
  });

  describe('#getApi', function () {
    it('getState', function () {
      const getApi = metamaskController.getApi();
      const state = getApi.getState();
      expect(state).toStrictEqual(metamaskController.getState());
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
      expect(preferenceControllerState.selectedAddress).toStrictEqual(address);
    });

    it('changes metamask controller selected address', function () {
      const metamaskState = metamaskController.getState();
      expect(metamaskState.selectedAddress).toStrictEqual(address);
    });
  });

  describe('connectHardware', function () {
    it('should throw if it receives an unknown device name', async function () {
      let error;

      try {
        await metamaskController.connectHardware(
          'Some random device name',
          0,
          `m/44/0'/0'`,
        );
      } catch (e) {
        error = e.message;
      }

      expect(error).toStrictEqual(
        'MetamaskController:getKeyringForDevice - Unknown device',
      );
    });

    it('should add the Trezor Hardware keyring', async function () {
      jest
        .spyOn(metamaskController.keyringController, 'addNewKeyring')
        .mockClear();
      await metamaskController
        .connectHardware(HardwareDeviceNames.trezor, 0)
        .catch(() => null);
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          KeyringType.trezor,
        );
      expect(
        metamaskController.keyringController.addNewKeyring.mock.calls[0],
      ).toStrictEqual([KeyringType.trezor]);
      expect(keyrings).toHaveLength(1);
    });

    it('should add the Ledger Hardware keyring', async function () {
      jest
        .spyOn(metamaskController.keyringController, 'addNewKeyring')
        .mockClear();
      await metamaskController
        .connectHardware(HardwareDeviceNames.ledger, 0)
        .catch(() => null);
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          KeyringType.ledger,
        );
      expect(
        metamaskController.keyringController.addNewKeyring.mock.calls[0],
      ).toStrictEqual([KeyringType.ledger]);
      expect(keyrings).toHaveLength(1);
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
      jest
        .spyOn(metamaskController.keyringController, 'getKeyringsByType')
        .mockClear()
        .mockReturnValue([mockHDKeyring]);

      const recoveredMnemonic = metamaskController.getPrimaryKeyringMnemonic();

      expect(recoveredMnemonic).toStrictEqual(uint8ArrayMnemonic);
    });
  });

  describe('checkHardwareStatus', function () {
    it('should throw if it receives an unknown device name', async function () {
      let error = '';

      try {
        await metamaskController.checkHardwareStatus(
          'Some random device name',
          `m/44/0'/0'`,
        );
      } catch (e) {
        error = e.message;
      }

      expect(error).toStrictEqual(
        'MetamaskController:getKeyringForDevice - Unknown device',
      );
    });

    it('should be locked by default', async function () {
      await metamaskController
        .connectHardware(HardwareDeviceNames.trezor, 0)
        .catch(() => null);
      const status = await metamaskController.checkHardwareStatus(
        HardwareDeviceNames.trezor,
      );
      expect(status).toStrictEqual(false);
    });
  });

  describe('isDeviceAccessible', function () {
    let unlock;
    let mockKeyrings = [];

    beforeEach(async function () {
      unlock = jest.fn();
      mockKeyrings = [
        {
          type: HardwareKeyringType.ledger,
          unlock,
        },
      ];
      jest
        .spyOn(metamaskController.keyringController, 'getKeyringsByType')
        .mockClear()
        .mockImplementation(() => mockKeyrings);
    });

    afterEach(function () {
      metamaskController.keyringController.getKeyringsByType.mockRestore();
      unlock.mockReset();
      // jest.clearAllMocks();
    });

    it('should call underlying keyring for ledger device and return false if inaccessible', async function () {
      unlock.rejects();
      // checking accessibility should invoke unlock
      const status = await metamaskController.isDeviceAccessible(
        HardwareDeviceNames.ledger,
        `m/44/0'/0'`,
      );

      // unlock should have been called on the mock device
      expect(unlock.calledOnce).toBeTruthy();
      expect(status).toStrictEqual(false);
    });

    it('should call underlying keyring for ledger device and return true if accessible', async function () {
      unlock.mockReturnValue(
        Promise.resolve('0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'),
      );
      // checking accessibility should invoke unlock
      const status = await metamaskController.isDeviceAccessible(
        HardwareDeviceNames.ledger,
        `m/44/0'/0'`,
      );
      expect(unlock).toHaveBeenCalledTimes(1);
      expect(status).toStrictEqual(true);
    });

    it('should not call underlying device for other devices', async function () {
      mockKeyrings = [
        {
          type: HardwareKeyringType.trezor,
          unlock,
          getModel: () => 'mock trezor',
          isUnlocked: () => false,
        },
      ];
      const status = await metamaskController.isDeviceAccessible(
        HardwareDeviceNames.trezor,
        `m/44'/1'/0'/0`,
      );
      expect(unlock).not.toHaveBeenCalled();
      expect(status).toStrictEqual(false);
    });
  });

  describe('forgetDevice', function () {
    it('should throw if it receives an unknown device name', async function () {
      let error = '';

      try {
        await metamaskController.forgetDevice('Some random device name');
      } catch (e) {
        error = e.message;
      }

      expect(error).toStrictEqual(
        'MetamaskController:getKeyringForDevice - Unknown device',
      );
    });

    it('should wipe all the keyring info', async function () {
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

  describe('unlockHardwareWalletAccount', function () {
    let accountToUnlock;
    let windowOpenStub;
    let addNewAccountStub;
    let getAccountsStub;
    beforeEach(async function () {
      accountToUnlock = 10;
      windowOpenStub = jest
        .spyOn(window, 'open')
        .mockClear()
        .mockImplementation();
      windowOpenStub.mockReturnValue(noop);

      addNewAccountStub = jest
        .spyOn(metamaskController.keyringController, 'addNewAccount')
        .mockClear()
        .mockImplementation();
      addNewAccountStub.mockReturnValue({});

      getAccountsStub = jest
        .spyOn(metamaskController.keyringController, 'getAccounts')
        .mockClear()
        .mockImplementation();
      // Need to return different address to mock the behavior of
      // adding a new account from the keyring
      getAccountsStub.mockImplementation(() => {
        if (getAccountsStub.mock.calls.length === 0) {
          return Promise.resolve(['0x1']);
        }

        return Promise.reject(new Error('Account not found'));
      });
      getAccountsStub.mockImplementation(() => {
        if (getAccountsStub.mock.calls.length === 1) {
          return Promise.resolve(['0x2']);
        }

        return Promise.reject(new Error('Account not found'));
      });
      getAccountsStub.mockImplementation(() => {
        if (getAccountsStub.mock.calls.length === 2) {
          return Promise.resolve(['0x3']);
        }

        return Promise.reject(new Error('Account not found'));
      });
      getAccountsStub.mockImplementation(() => {
        if (getAccountsStub.mock.calls.length === 3) {
          return Promise.resolve(['0x4']);
        }

        return Promise.reject(new Error('Account not found'));
      });
      jest
        .spyOn(metamaskController.preferencesController, 'setAddresses')
        .mockClear();
      jest
        .spyOn(metamaskController.preferencesController, 'setSelectedAddress')
        .mockClear();
      jest
        .spyOn(metamaskController.preferencesController, 'setAccountLabel')
        .mockClear();
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
      window.open.mockRestore();
      metamaskController.keyringController.addNewAccount.mockRestore();
      metamaskController.keyringController.getAccounts.mockRestore();
      metamaskController.preferencesController.setAddresses.mockRestore();
      metamaskController.preferencesController.setSelectedAddress.mockRestore();
      metamaskController.preferencesController.setAccountLabel.mockRestore();
    });

    it('should set unlockedAccount in the keyring', async function () {
      const keyrings =
        await metamaskController.keyringController.getKeyringsByType(
          KeyringType.trezor,
        );
      expect(keyrings[0].unlockedAccount).toStrictEqual(accountToUnlock);
    });

    it('should call keyringController.addNewAccount', async function () {
      expect(
        metamaskController.keyringController.addNewAccount,
      ).toHaveBeenCalledTimes(1);
    });

    it('should call keyringController.getAccounts', async function () {
      expect(
        metamaskController.keyringController.getAccounts.called,
      ).toBeTruthy();
    });

    it('should call preferencesController.setAddresses', async function () {
      expect(
        metamaskController.preferencesController.setAddresses,
      ).toHaveBeenCalledTimes(1);
    });

    it('should call preferencesController.setSelectedAddress', async function () {
      expect(
        metamaskController.preferencesController.setSelectedAddress,
      ).toHaveBeenCalledTimes(1);
    });

    it('should call preferencesController.setAccountLabel', async function () {
      expect(
        metamaskController.preferencesController.setAccountLabel,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('#addNewAccount', function () {
    it('errors when an primary keyring is does not exist', async function () {
      let error = '';

      try {
        await metamaskController.addNewAccount();
      } catch (e) {
        error = e.message;
      }

      expect(error).toStrictEqual('MetamaskController - No HD Key Tree found');
    });
  });

  describe('#verifyseedPhrase', function () {
    it('errors when no keying is provided', async function () {
      let error = '';

      try {
        await metamaskController.verifySeedPhrase();
      } catch (e) {
        error = e.message;
      }

      expect(error).toStrictEqual('MetamaskController - No HD Key Tree found');
    });

    it('#addNewAccount', async function () {
      await metamaskController.createNewVaultAndKeychain('password');
      await metamaskController.addNewAccount(1);
      const getAccounts =
        await metamaskController.keyringController.getAccounts();
      expect(getAccounts).toHaveLength(2);
    });
  });

  describe('#resetAccount', function () {
    it('wipes transactions from only the correct network id and with the selected address', async function () {
      const selectedAddressStub = jest
        .spyOn(metamaskController.preferencesController, 'getSelectedAddress')
        .mockClear()
        .mockImplementation();
      const getNetworkIdStub = jest
        .spyOn(metamaskController.txController.txStateManager, 'getNetworkId')
        .mockClear()
        .mockImplementation();

      selectedAddressStub.mockReturnValue(
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      );
      getNetworkIdStub.mockReturnValue(42);

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
      expect(
        metamaskController.txController.txStateManager.getTransaction(1),
      ).toBeUndefined();
    });
  });

  describe('#removeAccount', function () {
    let ret;
    const addressToRemove = '0x1';
    let mockKeyring;

    beforeEach(async function () {
      mockKeyring = {
        getAccounts: jest.fn().mockReturnValue(Promise.resolve([])),
        destroy: jest.fn(),
      };
      jest
        .spyOn(metamaskController.preferencesController, 'removeAddress')
        .mockClear()
        .mockImplementation();
      jest
        .spyOn(metamaskController.accountTracker, 'removeAccount')
        .mockClear()
        .mockImplementation();
      jest
        .spyOn(metamaskController.keyringController, 'removeAccount')
        .mockClear()
        .mockImplementation();
      jest
        .spyOn(metamaskController, 'removeAllAccountPermissions')
        .mockClear()
        .mockImplementation();
      jest
        .spyOn(metamaskController.keyringController, 'getKeyringForAccount')
        .mockClear()
        .mockReturnValue(Promise.resolve(mockKeyring));

      ret = await metamaskController.removeAccount(addressToRemove);
    });

    afterEach(function () {
      metamaskController.keyringController.removeAccount.mockRestore();
      metamaskController.accountTracker.removeAccount.mockRestore();
      metamaskController.preferencesController.removeAddress.mockRestore();
      metamaskController.removeAllAccountPermissions.mockRestore();

      mockKeyring.getAccounts.mockReset();
      mockKeyring.destroy.mockReset();
    });

    it('should call preferencesController.removeAddress', async function () {
      expect(
        metamaskController.preferencesController.removeAddress,
      ).toHaveBeenCalledWith(addressToRemove);
    });
    it('should call accountTracker.removeAccount', async function () {
      expect(
        metamaskController.accountTracker.removeAccount,
      ).toHaveBeenCalledWith([addressToRemove]);
    });
    it('should call keyringController.removeAccount', async function () {
      expect(
        metamaskController.keyringController.removeAccount,
      ).toHaveBeenCalledWith(addressToRemove);
    });
    it('should call metamaskController.removeAllAccountPermissions', async function () {
      expect(
        metamaskController.removeAllAccountPermissions,
      ).toHaveBeenCalledWith(addressToRemove);
    });
    it('should return address', async function () {
      expect(ret).toStrictEqual('0x1');
    });
    it('should call keyringController.getKeyringForAccount', async function () {
      expect(metamaskController.keyringController).toHaveBeenCalledWith(
        addressToRemove,
      );
    });
    it('should call keyring.destroy', async function () {
      expect(mockKeyring.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('#setupUntrustedCommunication', function () {
    const mockTxParams = { from: TEST_ADDRESS };

    beforeEach(function () {
      initializeMockMiddlewareLog();
    });

    afterAll(function () {
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
            expect(loggerMiddlewareMock.requests[0]).toStrictEqual({
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
            expect(loggerMiddlewareMock.requests[0]).toStrictEqual({
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
        expect(chunk.name).toStrictEqual('controller');
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
      expect(state.forgottenPassword).toStrictEqual(true);
    });
  });

  describe('#unMarkPasswordForgotten', function () {
    it('adds and sets forgottenPassword to config data to false', function () {
      metamaskController.unMarkPasswordForgotten(noop);
      const state = metamaskController.getState();
      expect(state.forgottenPassword).toStrictEqual(false);
    });
  });

  describe('#_onKeyringControllerUpdate', function () {
    it('should do nothing if there are no keyrings in state', async function () {
      const syncAddresses = jest.fn();
      const syncWithAddresses = jest.fn();
      sandbox.replace(metamaskController, 'preferencesController', {
        syncAddresses,
      });
      sandbox.replace(metamaskController, 'accountTracker', {
        syncWithAddresses,
      });

      const oldState = metamaskController.getState();
      await metamaskController._onKeyringControllerUpdate({ keyrings: [] });

      expect(syncAddresses).not.toHaveBeenCalled();
      expect(syncWithAddresses).not.toHaveBeenCalled();
      expect(metamaskController.getState()).toStrictEqual(oldState);
    });

    const FAKE_ACCOUNTS = ['0x1', '0x2'];
    it('should sync addresses if there are keyrings in state', async function () {
      const syncAddresses = jest.fn();
      const syncWithAddresses = jest.fn();
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
            accounts: FAKE_ACCOUNTS,
          },
        ],
      });

      expect(syncAddresses.mock.calls[0]).toStrictEqual([FAKE_ACCOUNTS]);
      expect(syncWithAddresses.mock.calls[0]).toStrictEqual([FAKE_ACCOUNTS]);
      expect(metamaskController.getState()).toStrictEqual(oldState);
    });

    it('should NOT update selected address if already unlocked', async function () {
      const syncAddresses = jest.fn();
      const syncWithAddresses = jest.fn();
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
            accounts: FAKE_ACCOUNTS,
          },
        ],
      });

      expect(syncAddresses.mock.calls[0]).toStrictEqual([FAKE_ACCOUNTS]);
      expect(syncWithAddresses.mock.calls[0]).toStrictEqual([FAKE_ACCOUNTS]);
      expect(metamaskController.getState()).toStrictEqual(oldState);
    });
  });

  describe('markNotificationsAsRead', function () {
    it('marks the notification as read', function () {
      metamaskController.markNotificationsAsRead([NOTIFICATION_ID]);
      const readNotification =
        metamaskController.getState().notifications[NOTIFICATION_ID];
      expect(readNotification.readDate).not.toBeNull();
    });
  });

  describe('dismissNotifications', function () {
    it('deletes the notification from state', function () {
      metamaskController.dismissNotifications([NOTIFICATION_ID]);
      const state = metamaskController.getState().notifications;
      expect(Object.values(state)).not.toContain(NOTIFICATION_ID);
    });
  });

  describe('getTokenStandardAndDetails', function () {
    const X6B_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    const XF0_ADDRESS = '0xf0d172594caedee459b89ad44c94098e474571b6';
    it('gets token data from the token list if available, and with a balance retrieved by fetchTokenBalance', async function () {
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
            [X6B_ADDRESS.toLowerCase()]: tokenData,
          },
        };
      });

      metamaskController.provider = provider;
      const tokenDetails = await metamaskController.getTokenStandardAndDetails(
        X6B_ADDRESS,
        XF0_ADDRESS,
      );

      expect(tokenDetails.standard).toStrictEqual('ERC20');
      expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
      expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
      expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
    });

    it('gets token data from tokens if available, and with a balance retrieved by fetchTokenBalance', async function () {
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
            address: X6B_ADDRESS.toLowerCase(),
            ...tokenData,
          },
        ],
      });

      metamaskController.provider = provider;
      const tokenDetails = await metamaskController.getTokenStandardAndDetails(
        X6B_ADDRESS,
        XF0_ADDRESS,
      );

      expect(tokenDetails.standard).toStrictEqual('ERC20');
      expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
      expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
      expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
    });

    it('gets token data from contract-metadata if available, and with a balance retrieved by fetchTokenBalance', async function () {
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
      const tokenDetails = await metamaskController.getTokenStandardAndDetails(
        X6B_ADDRESS,
        XF0_ADDRESS,
      );

      expect(tokenDetails.standard).toStrictEqual('ERC20');
      expect(tokenDetails.decimals).toStrictEqual('18');
      expect(tokenDetails.symbol).toStrictEqual('DAI');
      expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
    });

    it('gets token data from the blockchain, via the assetsContractController, if not available through other sources', async function () {
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
            [X6B_ADDRESS.toLowerCase()]: {},
          },
        };
      });

      metamaskController.provider = provider;

      sandbox
        .stub(
          metamaskController.assetsContractController,
          'getTokenStandardAndDetails',
        )
        .callsFake(() => {
          return tokenData;
        });

      const tokenDetails = await metamaskController.getTokenStandardAndDetails(
        '0xNotInTokenList',
        XF0_ADDRESS,
      );
      expect(tokenDetails.standard).toStrictEqual(
        tokenData.standard.toUpperCase(),
      );
      expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
      expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
      expect(tokenDetails.balance).toStrictEqual(tokenData.balance);
    });

    it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC721', async function () {
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

      sandbox
        .stub(
          metamaskController.assetsContractController,
          'getTokenStandardAndDetails',
        )
        .callsFake(() => {
          return tokenData;
        });

      const { balance, decimals, standard, symbol } =
        await metamaskController.getTokenStandardAndDetails(
          '0xAAA75474e89094c44da98b954eedeac495271d0f',
          XF0_ADDRESS,
        );
      expect(standard).toStrictEqual(tokenData.standard.toUpperCase());
      expect(decimals).toStrictEqual(String(tokenData.decimals));
      expect(symbol).toStrictEqual(tokenData.symbol);
      expect(balance).toStrictEqual(tokenData.balance);
    });

    it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC1155', async function () {
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

      sandbox
        .stub(
          metamaskController.assetsContractController,
          'getTokenStandardAndDetails',
        )
        .callsFake(() => {
          return tokenData;
        });

      const { balance, decimals, standard, symbol } =
        await metamaskController.getTokenStandardAndDetails(
          '0xAAA75474e89094c44da98b954eedeac495271d0f',
          XF0_ADDRESS,
        );
      expect(standard).toStrictEqual(tokenData.standard.toUpperCase());
      expect(decimals).toStrictEqual(String(tokenData.decimals));
      expect(symbol).toStrictEqual(tokenData.symbol);
      expect(balance).toStrictEqual(tokenData.balance);
    });

    describe('findNetworkConfigurationBy', function () {
      it('returns null if passed an object containing a valid networkConfiguration key but no matching value is found', function () {
        expect(
          metamaskController.findNetworkConfigurationBy({
            chainId: '0xnone',
          }),
        ).toBeNull();
      });
      it('returns null if passed an object containing an invalid networkConfiguration key', function () {
        expect(
          metamaskController.findNetworkConfigurationBy({
            invalidKey: '0xnone',
          }),
        ).toBeNull();
      });

      it('returns matching networkConfiguration when passed a chainId that matches an existing configuration', function () {
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

      it('returns matching networkConfiguration when passed a ticker that matches an existing configuration', function () {
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

      it('returns matching networkConfiguration when passed a nickname that matches an existing configuration', function () {
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

      it('returns null if passed an object containing mismatched networkConfiguration key/value combination', function () {
        expect(
          metamaskController.findNetworkConfigurationBy({
            nickname: MAINNET_CHAIN_ID,
          }),
        ).toBeNull();
      });

      it('returns the first networkConfiguration added if passed an key/value combination for which there are multiple matching configurations', function () {
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
});
