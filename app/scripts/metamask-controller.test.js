import { cloneDeep, last, noop } from 'lodash';
import nock from 'nock';
import { obj as createThoughStream } from 'through2';
import EthQuery from 'eth-query';
import browser from 'webextension-polyfill';
import { wordlist as englishWordlist } from '@metamask/scure-bip39/dist/wordlists/english';

import { KeyringController } from '@metamask/eth-keyring-controller';
import { TransactionStatus } from '../../shared/constants/transaction';
import createTxMeta from '../../test/lib/createTxMeta';
import { NETWORK_TYPES } from '../../shared/constants/network';
import { createTestProviderTools } from '../../test/stub/provider';
import {
  HardwareDeviceNames,
  HardwareKeyringType,
} from '../../shared/constants/hardware-wallets';
import {
  InternalKeyringType,
  KeyringType,
} from '../../shared/constants/keyring';
import {
  metamaskControllerArgumentConstructor,
  MockEthContract,
} from '../../test/helpers/metamask-controller';
import MetaMaskController from './metamask-controller';
import { deferredPromise } from './lib/util';
import PreferencesController from './controllers/preferences';

const Ganache = require('../../test/e2e/ganache');

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
jest.mock('ethjs-contract', () => MockEthContract);

jest.mock('@metamask/snaps-controllers', () => {
  // eslint-disable-next-line node/global-require
  return require('@metamask/snaps-controllers-flask');
});

jest.mock('@metamask/rpc-methods', () => {
  // eslint-disable-next-line node/global-require
  return require('@metamask/rpc-methods-flask');
});

// const MetaMaskController = require('./metamask-controller').default;

const CURRENT_NETWORK_ID = '5';
const CURRENT_CHAIN_ID = '5';
const DEFAULT_LABEL = 'Account 1';
const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const TEST_ADDRESS_4 = '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc';
const TEST_SEED_ALT =
  'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const TEST_HEX_BALANCE = '0x14ced5122ce0a000';
const TEST_TOKEN_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const TEST_DAI_ADDRESS = '0xAAA75474e89094c44da98b954eedeac495271d0f';
const TEST_USER_ADDRESS = '0xf0d172594caedee459b89ad44c94098e474571b6';

const SEND_TRANSACTION_METHOD = 'eth_sendTransaction';

const NOTIFICATION_ID = 'NHL8f2eSSTn9TKBamRLiU';

const ALT_MAINNET_RPC_URL = 'http://localhost:8545';
const POLYGON_RPC_URL = 'https://polygon.llamarpc.com';

const NETWORK_CONFIGURATION_ID_1 = 'networkConfigurationId1';
const NETWORK_CONFIGURATION_ID_2 = 'networkConfigurationId2';

const ALT_MAINNET_NAME = 'Alt Mainnet';
const POLYGON_NAME = 'Polygon';

const ETH = 'ETH';
const MATIC = 'MATIC';

const POLYGON_CHAIN_ID = '0x89';
const MAINNET_CHAIN_ID = '0x1';

const TREZOR_TESTNET_PATH = `m/44'/1'/0'/0`;
const BIP_44_PATH = `m/44/0'/0'`;

const UNKNOWN_DEVICE_ERROR_MESSAGE =
  'MetamaskController:getKeyringForDevice - Unknown device';
const NO_HD_KEY_ERROR_MESSAGE = 'MetamaskController - No HD Key Tree found';

const PROVIDER_RESULT_STUB = {
  eth_getCode: '0x123',
  eth_call:
    '0x00000000000000000000000000000000000000000000000029a2241af62c0000',
};

jest.mock('../../ui/store/actions', () => ({
  createNewVaultAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  unlockAndGetSeedPhrase: jest.fn().mockResolvedValue(null),
  createNewVaultAndRestore: jest.fn(),
  verifySeedPhrase: jest.fn(),
}));

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

describe('MetaMaskController', function () {
  let metamaskController;

  const sessionSetSpy = jest.fn().mockImplementation();
  const storageMock = {
    session: {
      set: sessionSetSpy,
      get: jest.fn(),
    },
  };

  beforeAll(async function () {
    globalThis.isFirstTimeProfileLoaded = true;
    await ganacheServer.start();
  });

  beforeEach(function () {
    jest.resetModules();

    browser.runtime = {
      ...browser.runtime,
      sendMessage: jest.fn().mockRejectedValue(),
    };

    jest.spyOn(MetaMaskController.prototype, 'resetStates').mockClear();
    jest
      .spyOn(KeyringController.prototype, 'createNewVaultAndKeychain')
      .mockClear();
    jest
      .spyOn(KeyringController.prototype, 'createNewVaultAndRestore')
      .mockClear();

    metamaskController = new MetaMaskController(
      metamaskControllerArgumentConstructor({
        isFirstMetaMaskControllerSetup: true,
        storageMock,
        includeInitState: true,
      }),
    );
  });

  afterEach(function () {
    jest.clearAllMocks();
    jest.resetModules();
  });

  afterAll(async function () {
    await ganacheServer.quit();
    nock.cleanAll();
  });

  describe('MetaMaskController Behaviour', function () {
    describe('should reset states on first time profile load', function () {
      it('in mv2, it should reset state without attempting to call browser storage', function () {
        expect(metamaskController.resetStates).toHaveBeenCalledTimes(1);
        expect(sessionSetSpy).not.toHaveBeenCalled();
      });
    });

    describe('#importAccountWithStrategy', function () {
      const importPrivKey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

      beforeEach(async function () {
        const password = 'a-fake-password';
        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
        await metamaskController.importAccountWithStrategy('Private Key', [
          importPrivKey,
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

        expect(privKeyHex).toStrictEqual(importPrivKey);
        // eslint-disable-next-line jest/prefer-strict-equal
        expect(pubAddressHexArr[0]).toEqual(TEST_ADDRESS_4);
      });

      it('adds 1 account', async function () {
        const keyringAccounts =
          await metamaskController.keyringController.getAccounts();
        expect(last(keyringAccounts)).toStrictEqual(TEST_ADDRESS_4);
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

        // eslint-disable-next-line jest/prefer-strict-equal
        expect(addresses).toEqual(expect.arrayContaining(identities));
        // eslint-disable-next-line jest/prefer-strict-equal
        expect(identities).toEqual(expect.arrayContaining(addresses));
      });
    });

    describe('#createNewVaultAndKeychain', function () {
      it('can only create new vault on keyringController once', async function () {
        const password = 'a-fake-password';

        await metamaskController.createNewVaultAndKeychain(password);
        await metamaskController.createNewVaultAndKeychain(password);

        expect(
          metamaskController.keyringController.createNewVaultAndKeychain,
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('#createNewVaultAndRestore', function () {
      const expectWithinRange = (value, [start, end]) => {
        expect(value).toBeGreaterThanOrEqual(start);
        expect(value).toBeLessThanOrEqual(end);
      };

      it('should be able to call newVaultAndRestore despite a mistake.', async function () {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        await metamaskController
          .createNewVaultAndRestore(password, TEST_SEED.slice(0, -1))
          .catch(() => null);
        await metamaskController
          .createNewVaultAndRestore(password, TEST_SEED)
          .catch(() => null);

        expect(
          metamaskController.keyringController.createNewVaultAndRestore,
        ).toHaveBeenCalledTimes(2);
      });

      const VAULT_PASSWORD = 'foobar1337';
      it('should clear previous identities after vault restoration', async function () {
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        const startTime = Date.now();
        await metamaskController.createNewVaultAndRestore(
          VAULT_PASSWORD,
          TEST_SEED,
        );
        const endTime = Date.now();

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

        const FAKE_ACCOUNT_NAME = 'Account Foo';
        await metamaskController.preferencesController.setAccountLabel(
          TEST_ADDRESS,
          FAKE_ACCOUNT_NAME,
        );

        const labelledFirstVaultIdentities = cloneDeep(
          metamaskController.getState().identities,
        );
        delete labelledFirstVaultIdentities[TEST_ADDRESS].lastSelected;
        expect(labelledFirstVaultIdentities).toStrictEqual({
          [TEST_ADDRESS]: { address: TEST_ADDRESS, name: FAKE_ACCOUNT_NAME },
        });

        const startTimeAlt = Date.now();
        await metamaskController.createNewVaultAndRestore(
          VAULT_PASSWORD,
          TEST_SEED_ALT,
        );
        const endTimeAlt = Date.now();

        const secondVaultIdentities = cloneDeep(
          metamaskController.getState().identities,
        );

        expectWithinRange(
          secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected,
          [startTimeAlt, endTimeAlt],
        );

        delete secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected;
        expect(secondVaultIdentities).toStrictEqual({
          [TEST_ADDRESS_ALT]: {
            address: TEST_ADDRESS_ALT,
            name: DEFAULT_LABEL,
          },
        });
      });

      it('should restore any consecutive accounts with balances without extra zero balance accounts', async function () {
        const originalFn = metamaskController.getBalance;

        jest
          .spyOn(metamaskController, 'getBalance')
          .mockClear()
          .mockImplementation(([address, ...args]) => {
            switch (address) {
              case TEST_ADDRESS:
                return Promise.resolve(TEST_HEX_BALANCE);
              case TEST_ADDRESS_2:
                return Promise.resolve('0x0');
              case TEST_ADDRESS_3:
                return Promise.resolve(TEST_HEX_BALANCE);
              default:
                return originalFn(address, ...args);
            }
          });

        const startTime = Date.now();
        await metamaskController.createNewVaultAndRestore(
          VAULT_PASSWORD,
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
        const accounts = {
          [TEST_ADDRESS]: { balance: TEST_HEX_BALANCE },
        };

        metamaskController.accountTracker.store.putState({ accounts });

        const gotten = await metamaskController.getBalance(TEST_ADDRESS);

        expect(TEST_HEX_BALANCE).toStrictEqual(gotten);
      });

      it('should ask the network for a balance when not known by accountTracker', async function () {
        const accounts = {};

        const ethQuery = new EthQuery();
        jest
          .spyOn(ethQuery, 'getBalance')
          .mockClear()
          .mockImplementation((_, callback) => {
            callback(undefined, TEST_HEX_BALANCE);
          });

        metamaskController.accountTracker.store.putState({ accounts });

        const gotten = await metamaskController.getBalance(
          TEST_ADDRESS,
          ethQuery,
        );

        expect(TEST_HEX_BALANCE).toStrictEqual(gotten);
      });
    });

    describe('#selectFirstIdentity', function () {
      beforeEach(function () {
        metamaskController.preferencesController.store.updateState({
          identities: {
            [TEST_ADDRESS]: {
              address: TEST_ADDRESS,
              name: 'Account 1',
            },
            [TEST_ADDRESS_ALT]: {
              address: TEST_ADDRESS_ALT,
              name: 'Account 2',
            },
          },
        });
        metamaskController.selectFirstIdentity();
      });

      it('changes preferences controller select address', function () {
        const preferenceControllerState =
          metamaskController.preferencesController.store.getState();
        expect(preferenceControllerState.selectedAddress).toStrictEqual(
          TEST_ADDRESS,
        );
      });

      it('changes metamask controller selected address', function () {
        const metamaskState = metamaskController.getState();
        expect(metamaskState.selectedAddress).toStrictEqual(TEST_ADDRESS);
      });
    });

    describe('connectHardware', function () {
      it('should throw if it receives an unknown device name', async function () {
        await expect(
          metamaskController.connectHardware(
            'Some random device name',
            0,
            BIP_44_PATH,
          ),
        ).rejects.toThrow(UNKNOWN_DEVICE_ERROR_MESSAGE);
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
          metamaskController.keyringController.addNewKeyring,
        ).toHaveBeenNthCalledWith(1, KeyringType.trezor);
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
          metamaskController.keyringController.addNewKeyring,
        ).toHaveBeenNthCalledWith(1, KeyringType.ledger);
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
          type: InternalKeyringType.hdKeyTree,
          mnemonic: uint8ArrayMnemonic,
        };
        jest
          .spyOn(metamaskController.keyringController, 'getKeyringsByType')
          .mockClear()
          .mockReturnValue([mockHDKeyring]);

        const recoveredMnemonic =
          metamaskController.getPrimaryKeyringMnemonic();

        expect(recoveredMnemonic).toStrictEqual(uint8ArrayMnemonic);
      });
    });

    describe('checkHardwareStatus', function () {
      it('should throw if it receives an unknown device name', async function () {
        await expect(
          metamaskController.checkHardwareStatus(
            'Some random device name',
            BIP_44_PATH,
          ),
        ).rejects.toThrow(UNKNOWN_DEVICE_ERROR_MESSAGE);
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
      const unlock = jest.fn();
      const mockKeyrings = [
        {
          type: HardwareKeyringType.ledger,
          unlock,
        },
      ];
      const keyringsByType = jest
        .spyOn(KeyringController.prototype, 'getKeyringsByType')
        .mockImplementation(() => mockKeyrings);

      beforeEach(function () {
        unlock.mockClear();
        keyringsByType.mockClear();
      });

      it('should call underlying keyring for ledger device and return false if inaccessible', async function () {
        // checking accessibility should invoke unlock
        const status = await metamaskController.isDeviceAccessible(
          HardwareDeviceNames.ledger,
          BIP_44_PATH,
        );

        // unlock should have been called on the mock device
        expect(unlock).toHaveBeenCalledTimes(1);
        expect(status).toStrictEqual(false);
      });

      it('should call underlying keyring for ledger device and return true if accessible', async function () {
        unlock.mockResolvedValue(TEST_ADDRESS);
        // checking accessibility should invoke unlock
        const status = await metamaskController.isDeviceAccessible(
          HardwareDeviceNames.ledger,
          BIP_44_PATH,
        );
        expect(unlock).toHaveBeenCalledTimes(1);
        expect(status).toStrictEqual(true);
      });

      it('should not call underlying device for other devices', async function () {
        keyringsByType.mockImplementationOnce(() => [
          {
            type: HardwareKeyringType.trezor,
            unlock,
            getModel: () => 'mock trezor',
            isUnlocked: () => false,
          },
        ]);
        const status = await metamaskController.isDeviceAccessible(
          HardwareDeviceNames.trezor,
          TREZOR_TESTNET_PATH,
        );
        expect(unlock).not.toHaveBeenCalled();
        expect(status).toStrictEqual(false);
      });
    });

    describe('forgetDevice', function () {
      it('should throw if it receives an unknown device name', async function () {
        await expect(
          metamaskController.forgetDevice('Some random device name'),
        ).rejects.toThrow(UNKNOWN_DEVICE_ERROR_MESSAGE);
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
      const accountToUnlock = 10;
      const windowOpenStub = jest
        .spyOn(window, 'open')
        .mockImplementation(noop);
      const addNewAccountStub = jest
        .spyOn(KeyringController.prototype, 'addNewAccount')
        .mockReturnValue({});
      const getAccountsStub = jest
        .spyOn(KeyringController.prototype, 'getAccounts')
        .mockResolvedValueOnce(['0x1'])
        .mockResolvedValueOnce(['0x2'])
        .mockResolvedValueOnce(['0x3'])
        .mockResolvedValueOnce(['0x4']);
      const setAddressesStub = jest.spyOn(
        PreferencesController.prototype,
        'setAddresses',
      );
      const setSelectedAddressStub = jest.spyOn(
        PreferencesController.prototype,
        'setSelectedAddress',
      );
      const setAccountLabelStub = jest.spyOn(
        PreferencesController.prototype,
        'setAccountLabel',
      );

      beforeEach(async function () {
        windowOpenStub.mockClear();
        addNewAccountStub.mockClear();
        getAccountsStub.mockClear();
        setAddressesStub.mockClear();
        setSelectedAddressStub.mockClear();
        setAccountLabelStub.mockClear();

        await metamaskController
          .connectHardware(HardwareDeviceNames.trezor, 0, TREZOR_TESTNET_PATH)
          .catch(() => null);
        await metamaskController.unlockHardwareWalletAccount(
          accountToUnlock,
          HardwareDeviceNames.trezor,
          TREZOR_TESTNET_PATH,
        );
      });

      afterEach(function () {
        windowOpenStub.mockRestore();
        addNewAccountStub.mockRestore();
        getAccountsStub.mockRestore();
        setAddressesStub.mockRestore();
        setSelectedAddressStub.mockRestore();
        setAccountLabelStub.mockRestore();
      });

      it('should set unlockedAccount in the keyring', async function () {
        const keyrings =
          await metamaskController.keyringController.getKeyringsByType(
            KeyringType.trezor,
          );
        expect(keyrings[0].unlockedAccount).toStrictEqual(accountToUnlock);
      });

      it('should call keyringController.addNewAccount', async function () {
        expect(addNewAccountStub).toHaveBeenCalledTimes(1);
      });

      it('should call keyringController.getAccounts', async function () {
        expect(getAccountsStub).toHaveBeenCalled();
      });

      it('should call preferencesController.setAddresses', async function () {
        expect(setAddressesStub).toHaveBeenCalledTimes(1);
      });

      it('should call preferencesController.setSelectedAddress', async function () {
        expect(setSelectedAddressStub).toHaveBeenCalledTimes(1);
      });

      it('should call preferencesController.setAccountLabel', async function () {
        expect(setAccountLabelStub).toHaveBeenCalledTimes(1);
      });
    });

    describe('#addNewAccount', function () {
      it('errors when an primary keyring is does not exist', async function () {
        await expect(metamaskController.addNewAccount()).rejects.toThrow(
          NO_HD_KEY_ERROR_MESSAGE,
        );
      });
    });

    describe('#verifyseedPhrase', function () {
      it('errors when no keying is provided', async function () {
        await expect(metamaskController.verifySeedPhrase()).rejects.toThrow(
          NO_HD_KEY_ERROR_MESSAGE,
        );
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
        jest
          .spyOn(metamaskController.preferencesController, 'getSelectedAddress')
          .mockClear()
          .mockReturnValue(TEST_ADDRESS);
        jest
          .spyOn(metamaskController.txController.txStateManager, 'getNetworkId')
          .mockClear()
          .mockReturnValue(42);

        metamaskController.txController.txStateManager._addTransactionsToState([
          createTxMeta({
            id: 1,
            status: TransactionStatus.unapproved,
            metamaskNetworkId: CURRENT_NETWORK_ID,
            txParams: { from: TEST_ADDRESS },
          }),
          createTxMeta({
            id: 1,
            status: TransactionStatus.unapproved,
            metamaskNetworkId: CURRENT_NETWORK_ID,
            txParams: { from: TEST_ADDRESS },
          }),
          createTxMeta({
            id: 2,
            status: TransactionStatus.rejected,
            metamaskNetworkId: '32',
          }),
          createTxMeta({
            id: 3,
            status: TransactionStatus.submitted,
            metamaskNetworkId: CURRENT_NETWORK_ID,
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
      const mockKeyring = {
        getAccounts: jest.fn().mockResolvedValue([]),
        destroy: jest.fn(),
      };

      beforeEach(async function () {
        mockKeyring.getAccounts.mockClear();
        mockKeyring.destroy.mockClear();

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
          .mockResolvedValue(mockKeyring);

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
        expect(ret).toStrictEqual(addressToRemove);
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

      it('adds a tabId and origin to requests', async function () {
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
          method: SEND_TRANSACTION_METHOD,
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
                expect(loggerMiddlewareMock.requests[0]).toStrictEqual({
                  ...message,
                  origin: 'http://mycrypto.com',
                  tabId: 456,
                });
                resolve();
              });
            },
          );
        });
      });

      it('should add only origin to request if tabId not provided', async function () {
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
          method: SEND_TRANSACTION_METHOD,
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
                expect(loggerMiddlewareMock.requests[0]).toStrictEqual({
                  ...message,
                  origin: 'http://mycrypto.com',
                });
                resolve();
              });
            },
          );
        });
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
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockClear()
          .mockImplementation();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockClear()
          .mockImplementation();

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

      const FAKE_ACCOUNTS = ['0x1', '0x2'];
      const keyrings = [
        {
          accounts: FAKE_ACCOUNTS,
        },
      ];
      it('should sync addresses if there are keyrings in state', async function () {
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockClear()
          .mockImplementation();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockClear()
          .mockImplementation();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          keyrings,
        });
        const newState = metamaskController.getState();

        expect(
          metamaskController.preferencesController.syncAddresses,
        ).toHaveBeenNthCalledWith(1, FAKE_ACCOUNTS);
        expect(
          metamaskController.accountTracker.syncWithAddresses,
        ).toHaveBeenNthCalledWith(1, FAKE_ACCOUNTS);
        expect(newState).toStrictEqual(oldState);
      });

      it('should NOT update selected address if already unlocked', async function () {
        jest
          .spyOn(metamaskController.preferencesController, 'syncAddresses')
          .mockClear()
          .mockImplementation();
        jest
          .spyOn(metamaskController.accountTracker, 'syncWithAddresses')
          .mockClear()
          .mockImplementation();

        const oldState = metamaskController.getState();

        await metamaskController._onKeyringControllerUpdate({
          isUnlocked: true,
          keyrings,
        });

        expect(
          metamaskController.preferencesController.syncAddresses,
        ).toHaveBeenNthCalledWith(1, FAKE_ACCOUNTS);
        expect(
          metamaskController.accountTracker.syncWithAddresses,
        ).toHaveBeenNthCalledWith(1, FAKE_ACCOUNTS);
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
      it('gets token data from the token list if available, and with a balance retrieved by fetchTokenBalance', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
        });

        const tokenData = {
          decimals: 18,
          symbol: 'DAI',
        };

        metamaskController.tokenListController.update(() => {
          return {
            tokenList: {
              [TEST_TOKEN_ADDRESS.toLowerCase()]: tokenData,
            },
          };
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            TEST_TOKEN_ADDRESS,
            TEST_USER_ADDRESS,
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from tokens if available, and with a balance retrieved by fetchTokenBalance', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
        });

        const tokenData = {
          decimals: 18,
          symbol: 'DAI',
        };

        metamaskController.tokensController.update({
          tokens: [
            {
              address: TEST_TOKEN_ADDRESS.toLowerCase(),
              ...tokenData,
            },
          ],
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            TEST_TOKEN_ADDRESS,
            TEST_USER_ADDRESS,
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from contract-metadata if available, and with a balance retrieved by fetchTokenBalance', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
        });

        metamaskController.provider = provider;
        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            TEST_TOKEN_ADDRESS,
            TEST_USER_ADDRESS,
          );

        expect(tokenDetails.standard).toStrictEqual('ERC20');
        expect(tokenDetails.decimals).toStrictEqual('18');
        expect(tokenDetails.symbol).toStrictEqual('DAI');
        expect(tokenDetails.balance).toStrictEqual('3000000000000000000');
      });

      it('gets token data from the blockchain, via the assetsContractController, if not available through other sources', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
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
              [TEST_TOKEN_ADDRESS.toLowerCase()]: {},
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockClear()
          .mockImplementation(() => {
            return tokenData;
          });

        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0xNotInTokenList',
            TEST_USER_ADDRESS,
          );
        expect(tokenDetails.standard).toStrictEqual(
          tokenData.standard.toUpperCase(),
        );
        expect(tokenDetails.decimals).toStrictEqual(String(tokenData.decimals));
        expect(tokenDetails.symbol).toStrictEqual(tokenData.symbol);
        expect(tokenDetails.balance).toStrictEqual(tokenData.balance);
      });

      it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC721', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
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
              [TEST_DAI_ADDRESS.toLowerCase()]: tokenData,
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockClear()
          .mockReturnValue(tokenData);

        const { balance, decimals, standard, symbol } =
          await metamaskController.getTokenStandardAndDetails(
            TEST_DAI_ADDRESS,
            TEST_USER_ADDRESS,
          );
        expect(standard).toStrictEqual(tokenData.standard.toUpperCase());
        expect(decimals).toStrictEqual(String(tokenData.decimals));
        expect(symbol).toStrictEqual(tokenData.symbol);
        expect(balance).toStrictEqual(tokenData.balance);
      });

      it('gets token data from the blockchain, via the assetsContractController, if it is in the token list but is an ERC1155', async function () {
        const { provider } = createTestProviderTools({
          scaffold: PROVIDER_RESULT_STUB,
          networkId: CURRENT_NETWORK_ID,
          chainId: CURRENT_CHAIN_ID,
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
              [TEST_DAI_ADDRESS.toLowerCase()]: tokenData,
            },
          };
        });

        metamaskController.provider = provider;

        jest
          .spyOn(
            metamaskController.assetsContractController,
            'getTokenStandardAndDetails',
          )
          .mockClear()
          .mockReturnValue(tokenData);

        const { balance, decimals, standard, symbol } =
          await metamaskController.getTokenStandardAndDetails(
            TEST_DAI_ADDRESS,
            TEST_USER_ADDRESS,
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
            nickname: ALT_MAINNET_NAME,
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
            nickname: POLYGON_NAME,
            id: NETWORK_CONFIGURATION_ID_2,
          });
        });

        it('returns matching networkConfiguration when passed a nickname that matches an existing configuration', function () {
          expect(
            metamaskController.findNetworkConfigurationBy({
              nickname: ALT_MAINNET_NAME,
            }),
          ).toStrictEqual({
            chainId: MAINNET_CHAIN_ID,
            nickname: ALT_MAINNET_NAME,
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
            nickname: POLYGON_NAME,
            id: NETWORK_CONFIGURATION_ID_2,
          });
        });
      });
    });
  });
  // =======
  //   describe('MV3 Specific behaviour', function () {
  //     before(async function () {
  //       globalThis.isFirstTimeProfileLoaded = true;
  //     });

  //     beforeEach(async function () {
  //       sandbox.spy(MetaMaskControllerMV3.prototype, 'resetStates');
  //     });

  //     it('it should reset state', function () {
  //       browserPolyfillMock.storage.session.set.resetHistory();

  //       const metamaskControllerMV3 = new MetaMaskControllerMV3({
  //         showUserConfirmation: noop,
  //         encryptor: {
  //           encrypt(_, object) {
  //             this.object = object;
  //             return Promise.resolve('mock-encrypted');
  //           },
  //           decrypt() {
  //             return Promise.resolve(this.object);
  //           },
  //         },
  //         initState: cloneDeep(firstTimeState),
  //         initLangCode: 'en_US',
  //         platform: {
  //           showTransactionNotification: () => undefined,
  //           getVersion: () => 'foo',
  //         },
  //         browser: browserPolyfillMock,
  //         infuraProjectId: 'foo',
  //         isFirstMetaMaskControllerSetup: true,
  //       });
  //       assert.equal(metamaskControllerMV3.resetStates.callCount, 1);
  //       assert.equal(browserPolyfillMock.storage.session.set.callCount, 1);
  //       assert.deepEqual(
  //         browserPolyfillMock.storage.session.set.getCall(0).args[0],
  //         {
  //           isFirstMetaMaskControllerSetup: false,
  //         },
  //       );
  //     });

  //     it('in mv3, it should not reset states if isFirstMetaMaskControllerSetup is false', function () {
  //       browserPolyfillMock.storage.session.set.resetHistory();

  //       const metamaskControllerMV3 = new MetaMaskControllerMV3({
  //         showUserConfirmation: noop,
  //         encryptor: {
  //           encrypt(_, object) {
  //             this.object = object;
  //             return Promise.resolve('mock-encrypted');
  //           },
  //           decrypt() {
  //             return Promise.resolve(this.object);
  //           },
  //         },
  //         initState: cloneDeep(firstTimeState),
  //         initLangCode: 'en_US',
  //         platform: {
  //           showTransactionNotification: () => undefined,
  //           getVersion: () => 'foo',
  //         },
  //         browser: browserPolyfillMock,
  //         infuraProjectId: 'foo',
  //         isFirstMetaMaskControllerSetup: false,
  //       });
  //       assert.equal(metamaskControllerMV3.resetStates.callCount, 0);
  //       assert.equal(browserPolyfillMock.storage.session.set.callCount, 0);
  //     });
  //   });
  // 46a2604df0f09f412c89d586a552ff2d07f9dff0
});
