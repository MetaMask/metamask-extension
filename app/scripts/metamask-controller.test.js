/**
 * @jest-environment node
 */
import { cloneDeep } from 'lodash';
import nock from 'nock';
import { obj as createThoughStream } from 'through2';
import EthQuery from '@metamask/eth-query';
import { wordlist as englishWordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import {
  ListNames,
  METAMASK_STALELIST_URL,
  METAMASK_HOTLIST_DIFF_URL,
  PHISHING_CONFIG_BASE_URL,
  METAMASK_STALELIST_FILE,
  METAMASK_HOTLIST_DIFF_FILE,
} from '@metamask/phishing-controller';
import { EthMethod, EthAccountType } from '@metamask/keyring-api';
import { NetworkType } from '@metamask/controller-utils';
import { ControllerMessenger } from '@metamask/base-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';
import { TransactionController } from '@metamask/transaction-controller';
import { NETWORK_TYPES } from '../../shared/constants/network';
import { createTestProviderTools } from '../../test/stub/provider';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { LOG_EVENT } from '../../shared/constants/logs';
import mockEncryptor from '../../test/lib/mock-encryptor';
import * as tokenUtils from '../../shared/lib/token-util';
import { deferredPromise } from './lib/util';
import MetaMaskController from './metamask-controller';

const { Ganache } = require('../../test/e2e/ganache');

const ganacheServer = new Ganache();

const browserPolyfillMock = {
  runtime: {
    id: 'fake-extension-id',
    onInstalled: {
      addListener: jest.fn(),
    },
    onMessageExternal: {
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
jest.mock(
  './controllers/preferences',
  () =>
    function (...args) {
      const PreferencesController = jest.requireActual(
        './controllers/preferences',
      ).default;
      const controller = new PreferencesController(...args);
      // jest.spyOn gets hoisted to the top of this function before controller is initialized.
      // This forces us to replace the function directly with a jest stub instead.
      // eslint-disable-next-line jest/prefer-spy-on
      controller.store.subscribe = jest.fn();
      return controller;
    },
);

const mockIsManifestV3 = jest.fn().mockReturnValue(false);
jest.mock('../../shared/modules/mv3.utils', () => ({
  get isManifestV3() {
    return mockIsManifestV3();
  },
}));

const DEFAULT_LABEL = 'Account 1';
const TEST_SEED =
  'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
const TEST_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TEST_ADDRESS_2 = '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b';
const TEST_ADDRESS_3 = '0xeb9e64b93097bc15f01f13eae97015c57ab64823';
const TEST_SEED_ALT =
  'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';
const TEST_ADDRESS_ALT = '0xc42edfcc21ed14dda456aa0756c153f7985d8813';
const TEST_INTERNAL_ACCOUNT = {
  id: '2d47e693-26c2-47cb-b374-6151199bbe3f',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  metadata: {
    name: 'Account 1',
    keyring: {
      type: 'HD Key Tree',
    },
    lastSelected: 0,
  },
  options: {},
  methods: [...Object.values(EthMethod)],
  type: EthAccountType.Eoa,
};

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
  AccountsController: {
    internalAccounts: {
      accounts: {},
      selectedAccount: '',
    },
  },
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
    selectedNetworkClientId: NetworkType.mainnet,
    networksMetadata: {
      [NetworkType.mainnet]: {
        EIPS: {
          1559: false,
        },
        status: 'available',
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
  PhishingController: {
    phishingLists: [
      {
        allowlist: [],
        blocklist: ['test.metamask-phishing.io'],
        fuzzylist: [],
        tolerance: 0,
        version: 0,
        name: 'MetaMask',
      },
    ],
  },
};

const noop = () => undefined;

describe('MetaMaskController', () => {
  beforeAll(async () => {
    await ganacheServer.start();
  });

  beforeEach(() => {
    nock('https://min-api.cryptocompare.com')
      .persist()
      .get(/.*/u)
      .reply(200, '{"JPY":12415.9}');
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
            blocklist: ['test.metamask-phishing.io'],
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
          {
            url: 'test.metamask-phishing.io',
            targetList: 'blocklist',
            timestamp: 0,
          },
        ]),
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
  });

  afterAll(async () => {
    await ganacheServer.quit();
  });

  describe('Phishing Detection Mock', () => {
    it('should be updated to use v1 of the API', () => {
      // Update the fixture above if this test fails
      expect(METAMASK_STALELIST_URL).toStrictEqual(
        'https://phishing-detection.metafi.codefi.network/v1/stalelist',
      );
      expect(METAMASK_HOTLIST_DIFF_URL).toStrictEqual(
        'https://phishing-detection.metafi.codefi.network/v1/diffsSince',
      );
    });
  });

  describe('MetaMaskController Behaviour', () => {
    let metamaskController;

    beforeEach(() => {
      jest.spyOn(MetaMaskController.prototype, 'resetStates');

      jest
        .spyOn(TransactionController.prototype, 'updateIncomingTransactions')
        .mockReturnValue();

      jest
        .spyOn(
          TransactionController.prototype,
          'startIncomingTransactionPolling',
        )
        .mockReturnValue();

      jest
        .spyOn(
          TransactionController.prototype,
          'stopIncomingTransactionPolling',
        )
        .mockReturnValue();

      jest.spyOn(ControllerMessenger.prototype, 'subscribe');

      metamaskController = new MetaMaskController({
        showUserConfirmation: noop,
        encryptor: mockEncryptor,
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

      jest.spyOn(
        metamaskController.keyringController,
        'createNewVaultAndKeychain',
      );
      jest.spyOn(
        metamaskController.keyringController,
        'createNewVaultAndRestore',
      );
      jest
        .spyOn(metamaskController.preferencesController, 'removeAddress')
        .mockImplementation((address) => address);
    });

    describe('should reset states on first time profile load', () => {
      it('in mv2, it should reset state without attempting to call browser storage', () => {
        expect(metamaskController.resetStates).toHaveBeenCalledTimes(1);
        expect(browserPolyfillMock.storage.session.set).not.toHaveBeenCalled();
      });
    });

    describe('on new version install', () => {
      const mockOnInstalledEventDetails = {
        reason: 'update',
        previousVersion: '1.0.0',
      };
      browserPolyfillMock.runtime.onInstalled.addListener.mockImplementation(
        (handler) => {
          handler(mockOnInstalledEventDetails);
        },
      );

      it('should details with LoggingController', async () => {
        const mockVersion = '1.3.7';
        const mockGetVersionInfo = jest.fn().mockReturnValue(mockVersion);

        jest.spyOn(LoggingController.prototype, 'add');

        const localController = new MetaMaskController({
          initLangCode: 'en_US',
          platform: {
            getVersion: mockGetVersionInfo,
          },
          browser: browserPolyfillMock,
          infuraProjectId: 'foo',
        });

        expect(localController.loggingController.add).toHaveBeenCalledTimes(1);
        expect(localController.loggingController.add).toHaveBeenCalledWith({
          type: LogType.GenericLog,
          data: {
            event: LOG_EVENT.VERSION_UPDATE,
            previousVersion: mockOnInstalledEventDetails.previousVersion,
            version: mockVersion,
          },
        });
      });

      it('should openExtensionInBrowser if version is 8.1.0', () => {
        const mockVersion = '8.1.0';
        const mockGetVersionInfo = jest.fn().mockReturnValue(mockVersion);

        const openExtensionInBrowserMock = jest.fn();

        // eslint-disable-next-line no-new
        new MetaMaskController({
          initLangCode: 'en_US',
          platform: {
            getVersion: mockGetVersionInfo,
            openExtensionInBrowser: openExtensionInBrowserMock,
          },
          browser: browserPolyfillMock,
          infuraProjectId: 'foo',
        });

        expect(openExtensionInBrowserMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('#importAccountWithStrategy', () => {
      const importPrivkey =
        '4cfd3e90fc78b0f86bf7524722150bb8da9c60cd532564d7ff43f5716514f553';

      beforeEach(async () => {
        const password = 'a-fake-password';
        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
        await metamaskController.importAccountWithStrategy('privateKey', [
          importPrivkey,
        ]);
      });

      it('adds private key to keyrings in KeyringController', async () => {
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

      it('adds 1 account', async () => {
        const keyringAccounts =
          await metamaskController.keyringController.getAccounts();
        expect(keyringAccounts[keyringAccounts.length - 1]).toStrictEqual(
          '0xe18035bf8712672935fdb4e5e431b1a0183d2dfc',
        );
      });
    });

    describe('submitPassword', () => {
      it('removes any identities that do not correspond to known accounts.', async () => {
        const accountsControllerSpy = jest.spyOn(
          metamaskController.accountsController,
          'updateAccounts',
        );
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

        const internalAccounts =
          metamaskController.accountsController.listAccounts();

        internalAccounts.forEach((account) => {
          expect(addresses).toContain(account.address);
        });

        addresses.forEach((address) => {
          expect(
            internalAccounts.find((account) => account.address === address),
          ).toBeDefined();
        });

        expect(accountsControllerSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('setLocked', () => {
      it('should lock KeyringController', async () => {
        jest.spyOn(metamaskController.keyringController, 'setLocked');

        await metamaskController.setLocked();

        expect(
          metamaskController.keyringController.setLocked,
        ).toHaveBeenCalled();
        expect(
          metamaskController.keyringController.state.isUnlocked,
        ).toStrictEqual(false);
      });
    });

    describe('#createNewVaultAndKeychain', () => {
      it('can only create new vault on keyringController once', async () => {
        jest.spyOn(metamaskController, 'selectFirstAccount').mockReturnValue();
        const password = 'a-fake-password';

        const vault1 = await metamaskController.createNewVaultAndKeychain(
          password,
        );
        const vault2 = await metamaskController.createNewVaultAndKeychain(
          password,
        );

        expect(vault1).toStrictEqual(vault2);
      });
    });

    describe('#createNewVaultAndRestore', () => {
      it('should be able to call newVaultAndRestore despite a mistake.', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        await metamaskController
          .createNewVaultAndRestore(password, TEST_SEED.slice(0, -1))
          .catch(() => null);
        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);

        expect(
          metamaskController.keyringController.createNewVaultAndRestore,
        ).toHaveBeenCalledTimes(2);
      });

      it('should clear previous identities after vault restoration', async () => {
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        let startTime = Date.now();
        await metamaskController.createNewVaultAndRestore(
          'foobar1337',
          TEST_SEED,
        );
        let endTime = Date.now();

        const firstVaultIdentities = cloneDeep(
          metamaskController.getState().identities,
        );
        expect(
          firstVaultIdentities[TEST_ADDRESS].lastSelected >= startTime &&
            firstVaultIdentities[TEST_ADDRESS].lastSelected <= endTime,
        ).toStrictEqual(true);
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
        expect(
          secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected >= startTime &&
            secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected <= endTime,
        ).toStrictEqual(true);
        delete secondVaultIdentities[TEST_ADDRESS_ALT].lastSelected;
        expect(secondVaultIdentities).toStrictEqual({
          [TEST_ADDRESS_ALT]: {
            address: TEST_ADDRESS_ALT,
            name: DEFAULT_LABEL,
          },
        });
      });

      it('should restore any consecutive accounts with balances without extra zero balance accounts', async () => {
        // Give account 1 a balance
        jest
          .spyOn(metamaskController, 'getBalance')
          .mockImplementation((address) => {
            switch (address) {
              case TEST_ADDRESS:
                return Promise.resolve('0x14ced5122ce0a000');
              case TEST_ADDRESS_2:
              case TEST_ADDRESS_3:
                return Promise.resolve('0x0');
              default:
                return Promise.reject(
                  new Error('unexpected argument to mocked getBalance'),
                );
            }
          });

        // Give account 2 a token
        jest
          .spyOn(metamaskController.tokensController, 'state', 'get')
          .mockReturnValue({
            allTokens: {},
            allIgnoredTokens: {},
            allDetectedTokens: { '0x1': { [TEST_ADDRESS_2]: [{}] } },
          });

        const startTime = Date.now();
        await metamaskController.createNewVaultAndRestore(
          'foobar1337',
          TEST_SEED,
        );

        // Expect first account to be selected
        const identities = cloneDeep(metamaskController.getState().identities);
        expect(
          identities[TEST_ADDRESS].lastSelected >= startTime &&
            identities[TEST_ADDRESS].lastSelected <= Date.now(),
        ).toStrictEqual(true);

        // Expect first 2 accounts to be restored
        delete identities[TEST_ADDRESS].lastSelected;
        expect(identities).toStrictEqual({
          [TEST_ADDRESS]: { address: TEST_ADDRESS, name: DEFAULT_LABEL },
          [TEST_ADDRESS_2]: { address: TEST_ADDRESS_2, name: 'Account 2' },
        });
      });
    });

    describe('#getBalance', () => {
      it('should return the balance known by accountTracker', async () => {
        const accounts = {};
        const balance = '0x14ced5122ce0a000';
        accounts[TEST_ADDRESS] = { balance };

        metamaskController.accountTracker.store.putState({ accounts });

        const gotten = await metamaskController.getBalance(TEST_ADDRESS);

        expect(balance).toStrictEqual(gotten);
      });

      it('should ask the network for a balance when not known by accountTracker', async () => {
        const accounts = {};
        const balance = '0x14ced5122ce0a000';
        const ethQuery = new EthQuery();
        jest.spyOn(ethQuery, 'getBalance').mockImplementation((_, callback) => {
          callback(undefined, balance);
        });

        metamaskController.accountTracker.store.putState({ accounts });

        const gotten = await metamaskController.getBalance(
          TEST_ADDRESS,
          ethQuery,
        );

        expect(balance).toStrictEqual(gotten);
      });
    });

    describe('#getApi', () => {
      it('getState', () => {
        const getApi = metamaskController.getApi();
        const state = getApi.getState();
        expect(state).toStrictEqual(metamaskController.getState());
      });
    });

    describe('#selectFirstAccount', () => {
      let identities;

      beforeEach(async () => {
        await metamaskController.keyringController.createNewVaultAndRestore(
          'password',
          TEST_SEED,
        );
        await metamaskController.addNewAccount(1);
        await metamaskController.addNewAccount(2);

        identities = {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            TEST_ADDRESS,
            name: 'Account 1',
          },
          '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
            TEST_ADDRESS_2,
            name: 'Account 2',
          },
        };
        metamaskController.preferencesController.store.updateState({
          identities,
        });
        metamaskController.selectFirstAccount();
      });

      it('changes preferences controller select address', () => {
        const preferenceControllerState =
          metamaskController.preferencesController.store.getState();
        expect(preferenceControllerState.selectedAddress).toStrictEqual(
          TEST_ADDRESS,
        );
      });

      it('changes metamask controller selected address', () => {
        const metamaskState = metamaskController.getState();
        expect(metamaskState.selectedAddress).toStrictEqual(TEST_ADDRESS);
      });
    });

    describe('connectHardware', () => {
      it('should throw if it receives an unknown device name', async () => {
        const result = metamaskController.connectHardware(
          'Some random device name',
          0,
          `m/44/0'/0'`,
        );

        await expect(result).rejects.toThrow(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      });

      it('should add the Trezor Hardware keyring', async () => {
        jest.spyOn(metamaskController.keyringController, 'addNewKeyring');
        await metamaskController
          .connectHardware(HardwareDeviceNames.trezor, 0)
          .catch(() => null);
        const keyrings =
          await metamaskController.keyringController.getKeyringsByType(
            KeyringType.trezor,
          );
        expect(
          metamaskController.keyringController.addNewKeyring,
        ).toHaveBeenCalledWith(KeyringType.trezor);
        expect(keyrings).toHaveLength(1);
      });

      it('should add the Ledger Hardware keyring', async () => {
        jest.spyOn(metamaskController.keyringController, 'addNewKeyring');
        await metamaskController
          .connectHardware(HardwareDeviceNames.ledger, 0)
          .catch(() => null);
        const keyrings =
          await metamaskController.keyringController.getKeyringsByType(
            KeyringType.ledger,
          );
        expect(
          metamaskController.keyringController.addNewKeyring,
        ).toHaveBeenCalledWith(KeyringType.ledger);
        expect(keyrings).toHaveLength(1);
      });
    });

    describe('getPrimaryKeyringMnemonic', () => {
      it('should return a mnemonic as a Uint8Array', () => {
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
          .mockReturnValue([mockHDKeyring]);

        const recoveredMnemonic =
          metamaskController.getPrimaryKeyringMnemonic();

        expect(recoveredMnemonic).toStrictEqual(uint8ArrayMnemonic);
      });
    });

    describe('checkHardwareStatus', () => {
      it('should throw if it receives an unknown device name', async () => {
        const result = metamaskController.checkHardwareStatus(
          'Some random device name',
          `m/44/0'/0'`,
        );
        await expect(result).rejects.toThrow(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      });

      it('should be locked by default', async () => {
        await metamaskController
          .connectHardware(HardwareDeviceNames.trezor, 0)
          .catch(() => null);
        const status = await metamaskController.checkHardwareStatus(
          HardwareDeviceNames.trezor,
        );
        expect(status).toStrictEqual(false);
      });
    });

    describe('forgetDevice', () => {
      it('should throw if it receives an unknown device name', async () => {
        const result = metamaskController.forgetDevice(
          'Some random device name',
        );
        await expect(result).rejects.toThrow(
          'MetamaskController:getKeyringForDevice - Unknown device',
        );
      });

      it('should remove the identities when the device is forgotten', async () => {
        jest.spyOn(window, 'open').mockReturnValue();

        const localMetaMaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            KeyringController: {
              keyrings: [{ type: KeyringType.trezor, accounts: ['0x123'] }],
              isUnlocked: true,
            },
            PreferencesController: {
              identities: {
                '0x123': { name: 'Trezor 1', address: '0x123' },
              },
              selectedAddress: '0x123',
            },
          },
          initLangCode: 'en_US',
          platform: {
            showTransactionNotification: () => undefined,
            getVersion: () => 'foo',
          },
          browser: browserPolyfillMock,
          infuraProjectId: 'foo',
          isFirstMetaMaskControllerSetup: true,
        });

        await localMetaMaskController.keyringController.createNewVaultAndKeychain(
          'password',
        );

        await localMetaMaskController.keyringController.addNewKeyring(
          'Trezor Hardware',
          {
            accounts: ['0x123'],
          },
        );

        await localMetaMaskController.forgetDevice(HardwareDeviceNames.trezor);
        const { identities: updatedIdentities } =
          localMetaMaskController.preferencesController.store.getState();
        expect(updatedIdentities['0x123']).toBeUndefined();
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

        jest
          .spyOn(metamaskController.accountsController, 'getAccountByAddress')
          .mockReturnValue({
            account: {
              id: '2d47e693-26c2-47cb-b374-6151199bbe3f',
            },
          });
        jest
          .spyOn(metamaskController.accountsController, 'setAccountName')
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

      it('should call accountsController.getAccountByAddress', async () => {
        expect(
          metamaskController.accountsController.getAccountByAddress,
        ).toHaveBeenCalledTimes(1);
      });

      it('should call accountsController.setAccountName', async () => {
        expect(
          metamaskController.accountsController.setAccountName,
        ).toHaveBeenCalledTimes(1);
      });
    });

    describe('#addNewAccount', () => {
      it('errors when an primary keyring is does not exist', async () => {
        const addNewAccount = metamaskController.addNewAccount();

        await expect(addNewAccount).rejects.toThrow('No HD keyring found');
      });
    });

    describe('#getSeedPhrase', () => {
      it('errors when no password is provided', async () => {
        await expect(metamaskController.getSeedPhrase()).rejects.toThrow(
          'KeyringController - Cannot unlock without a previous vault.',
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
      it('wipes transactions from only the correct network id and with the selected address', async () => {
        const selectedAddressMock =
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

        jest
          .spyOn(metamaskController.accountsController, 'getSelectedAccount')
          .mockReturnValue({ address: selectedAddressMock });

        jest.spyOn(metamaskController.txController, 'wipeTransactions');

        await metamaskController.resetAccount();

        expect(
          metamaskController.txController.wipeTransactions,
        ).toHaveBeenCalledTimes(1);
        expect(
          metamaskController.txController.wipeTransactions,
        ).toHaveBeenCalledWith(true, selectedAddressMock);
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
        metamaskController.preferencesController.setSecurityAlertsEnabled(
          false,
        );
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
          balance: '1',
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

        const spyOnFetchERC1155Balance = jest
          .spyOn(tokenUtils, 'fetchERC1155Balance')
          .mockReturnValue({ _hex: '0x1' });

        const tokenDetails =
          await metamaskController.getTokenStandardAndDetails(
            '0xAAA75474e89094c44da98b954eedeac495271d0f',
            '0xf0d172594caedee459b89ad44c94098e474571b6',
          );

        expect(spyOnFetchERC1155Balance).toHaveBeenCalled();
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

    describe('getTokenSymbol', () => {
      it('should gets token symbol for given address', async () => {
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

        const tokenSymbol = await metamaskController.getTokenSymbol(
          '0xNotInTokenList',
        );

        expect(tokenSymbol).toStrictEqual(tokenData.symbol);
      });

      it('should return null for given token address', async () => {
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
          .mockImplementation(() => {
            throw new Error('error');
          });

        const tokenSymbol = await metamaskController.getTokenSymbol(
          '0xNotInTokenList',
        );

        expect(tokenSymbol).toStrictEqual(null);
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

        metamaskController.controllerMessenger.publish(
          'AccountsController:selectedAccountChange',
          TEST_INTERNAL_ACCOUNT,
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
    });
  });

  describe('MV3 Specific behaviour', () => {
    beforeAll(async () => {
      mockIsManifestV3.mockReturnValue(true);
      globalThis.isFirstTimeProfileLoaded = true;
    });

    beforeEach(async () => {
      jest.spyOn(MetaMaskController.prototype, 'resetStates');
    });

    it('should reset state', () => {
      browserPolyfillMock.storage.session.set.mockReset();

      const metamaskController = new MetaMaskController({
        showUserConfirmation: noop,
        encryptor: mockEncryptor,
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

      expect(metamaskController.resetStates).toHaveBeenCalledTimes(1);
      expect(browserPolyfillMock.storage.session.set).toHaveBeenCalledTimes(1);
      expect(browserPolyfillMock.storage.session.set).toHaveBeenCalledWith({
        isFirstMetaMaskControllerSetup: false,
      });
    });

    it('in mv3, it should not reset states if isFirstMetaMaskControllerSetup is false', () => {
      browserPolyfillMock.storage.session.set.mockReset();

      const metamaskController = new MetaMaskController({
        showUserConfirmation: noop,
        encryptor: mockEncryptor,
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

      expect(metamaskController.resetStates).not.toHaveBeenCalled();
      expect(browserPolyfillMock.storage.session.set).not.toHaveBeenCalled();
    });
  });
});
