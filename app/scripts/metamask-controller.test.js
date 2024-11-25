/**
 * @jest-environment node
 */
import { cloneDeep } from 'lodash';
import nock from 'nock';
import { obj as createThroughStream } from 'through2';
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
import {
  BtcAccountType,
  BtcMethod,
  EthAccountType,
} from '@metamask/keyring-api';
import { ControllerMessenger } from '@metamask/base-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';
import { TransactionController } from '@metamask/transaction-controller';
import {
  RatesController,
  TokenListController,
} from '@metamask/assets-controllers';
import ObjectMultiplex from '@metamask/object-multiplex';
import { TrezorKeyring } from '@metamask/eth-trezor-keyring';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import { createTestProviderTools } from '../../test/stub/provider';
import { HardwareDeviceNames } from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { LOG_EVENT } from '../../shared/constants/logs';
import mockEncryptor from '../../test/lib/mock-encryptor';
import * as tokenUtils from '../../shared/lib/token-util';
import { flushPromises } from '../../test/lib/timer-helpers';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { mockNetworkState } from '../../test/stub/networks';
import {
  BalancesController as MultichainBalancesController,
  BTC_BALANCES_UPDATE_TIME as MULTICHAIN_BALANCES_UPDATE_TIME,
} from './lib/accounts/BalancesController';
import { BalancesTracker as MultichainBalancesTracker } from './lib/accounts/BalancesTracker';
import { deferredPromise } from './lib/util';
import { METAMASK_COOKIE_HANDLER } from './constants/stream';
import MetaMaskController, {
  ONE_KEY_VIA_TREZOR_MINOR_VERSION,
} from './metamask-controller';

const { Ganache } = require('../../test/e2e/seeder/ganache');

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

const rpcMethodMiddlewareMock = {
  createMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
  createLegacyMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
  createUnsupportedMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
};
jest.mock('./lib/rpc-method-middleware', () => rpcMethodMiddlewareMock);

const KNOWN_PUBLIC_KEY =
  '02065bc80d3d12b3688e4ad5ab1e9eda6adf24aec2518bfc21b87c99d4c5077ab0';

const KNOWN_PUBLIC_KEY_ADDRESSES = [
  {
    address: '0x0e122670701207DB7c6d7ba9aE07868a4572dB3f',
    balance: null,
    index: 0,
  },
  {
    address: '0x2ae19DAd8b2569F7Bb4606D951Cc9495631e818E',
    balance: null,
    index: 1,
  },
  {
    address: '0x0051140bAaDC3E9AC92A4a90D18Bb6760c87e7ac',
    balance: null,
    index: 2,
  },
  {
    address: '0x9DBCF67CC721dBd8Df28D7A0CbA0fa9b0aFc6472',
    balance: null,
    index: 3,
  },
  {
    address: '0x828B2c51c5C1bB0c57fCD2C108857212c95903DE',
    balance: null,
    index: 4,
  },
];

const buildMockKeyringBridge = (publicKeyPayload) =>
  jest.fn(() => ({
    init: jest.fn(),
    dispose: jest.fn(),
    updateTransportMethod: jest.fn(),
    getPublicKey: jest.fn(async () => publicKeyPayload),
  }));

jest.mock('@metamask/eth-trezor-keyring', () => ({
  ...jest.requireActual('@metamask/eth-trezor-keyring'),
  TrezorConnectBridge: buildMockKeyringBridge({
    success: true,
    payload: {
      publicKey: KNOWN_PUBLIC_KEY,
      chainCode: '0x1',
    },
  }),
}));

jest.mock('@metamask/eth-ledger-bridge-keyring', () => ({
  ...jest.requireActual('@metamask/eth-ledger-bridge-keyring'),
  LedgerIframeBridge: buildMockKeyringBridge({
    publicKey: KNOWN_PUBLIC_KEY,
    chainCode: '0x1',
  }),
}));

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
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
};

const NOTIFICATION_ID = 'NHL8f2eSSTn9TKBamRLiU';

const ALT_MAINNET_RPC_URL = 'http://localhost:8545';
const POLYGON_RPC_URL = 'https://polygon.llamarpc.com';

const NETWORK_CONFIGURATION_ID_1 = 'networkConfigurationId1';
const NETWORK_CONFIGURATION_ID_2 = 'networkConfigurationId2';

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
    ...mockNetworkState(
      {
        rpcUrl: ALT_MAINNET_RPC_URL,
        chainId: MAINNET_CHAIN_ID,
        ticker: ETH,
        nickname: 'Alt Mainnet',
        id: NETWORK_CONFIGURATION_ID_1,
        blockExplorerUrl: undefined,
      },
      {
        rpcUrl: POLYGON_RPC_URL,
        chainId: POLYGON_CHAIN_ID,
        ticker: MATIC,
        nickname: 'Polygon',
        id: NETWORK_CONFIGURATION_ID_2,
        blockExplorerUrl: undefined,
      },
    ),
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

    globalThis.sentry = {
      withIsolationScope: jest.fn(),
    };
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
        'https://phishing-detection.api.cx.metamask.io/v1/stalelist',
      );
      expect(METAMASK_HOTLIST_DIFF_URL).toStrictEqual(
        'https://phishing-detection.api.cx.metamask.io/v1/diffsSince',
      );
    });
  });

  describe('MetaMaskController Behaviour', () => {
    let metamaskController;

    async function simulatePreferencesChange(preferences) {
      metamaskController.controllerMessenger.publish(
        'PreferencesController:stateChange',
        preferences,
      );
      await flushPromises();
    }

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
      jest.spyOn(TokenListController.prototype, 'start');
      jest.spyOn(TokenListController.prototype, 'stop');
      jest.spyOn(TokenListController.prototype, 'clearingTokenListData');

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

      const metamaskVersion = process.env.METAMASK_VERSION;
      afterEach(() => {
        // reset `METAMASK_VERSION` env var
        process.env.METAMASK_VERSION = metamaskVersion;
      });

      it('should details with LoggingController', async () => {
        const mockVersion = '1.3.7';
        process.env.METAMASK_VERSION = mockVersion;

        jest.spyOn(LoggingController.prototype, 'add');

        const localController = new MetaMaskController({
          initLangCode: 'en_US',
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
        process.env.METAMASK_VERSION = mockVersion;

        const openExtensionInBrowserMock = jest.fn();

        // eslint-disable-next-line no-new
        new MetaMaskController({
          initLangCode: 'en_US',
          platform: {
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

    describe('#getAddTransactionRequest', () => {
      it('formats the transaction for submission', () => {
        const transactionParams = { from: '0xa', to: '0xb' };
        const transactionOptions = { foo: true };
        const result = metamaskController.getAddTransactionRequest({
          transactionParams,
          transactionOptions,
        });
        expect(result).toStrictEqual({
          internalAccounts:
            metamaskController.accountsController.listAccounts(),
          dappRequest: undefined,
          networkClientId:
            metamaskController.networkController.state.selectedNetworkClientId,
          selectedAccount:
            metamaskController.accountsController.getAccountByAddress(
              transactionParams.from,
            ),
          transactionController: expect.any(Object),
          transactionOptions,
          transactionParams,
          userOperationController: expect.any(Object),
          chainId: '0x1',
          ppomController: expect.any(Object),
          securityAlertsEnabled: expect.any(Boolean),
          updateSecurityAlertResponse: expect.any(Function),
        });
      });
      it('passes through any additional params to the object', () => {
        const transactionParams = { from: '0xa', to: '0xb' };
        const transactionOptions = { foo: true };
        const result = metamaskController.getAddTransactionRequest({
          transactionParams,
          transactionOptions,
          test: '123',
        });

        expect(result).toMatchObject({
          transactionParams,
          transactionOptions,
          test: '123',
        });
      });
    });

    describe('submitPassword', () => {
      it('removes any identities that do not correspond to known accounts.', async () => {
        const fakeAddress = '0xbad0';

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
                [fakeAddress]: { name: 'fake', address: fakeAddress },
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

        const accountsControllerSpy = jest.spyOn(
          localMetaMaskController.accountsController,
          'updateAccounts',
        );

        const password = 'password';
        await localMetaMaskController.createNewVaultAndKeychain(password);

        await localMetaMaskController.submitPassword(password);

        const identities = Object.keys(
          localMetaMaskController.preferencesController.state.identities,
        );
        const addresses =
          await localMetaMaskController.keyringController.getAccounts();

        identities.forEach((identity) => {
          expect(addresses).toContain(identity);
        });

        addresses.forEach((address) => {
          expect(identities).toContain(address);
        });

        const internalAccounts =
          localMetaMaskController.accountsController.listAccounts();

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

        await metamaskController.createNewVaultAndRestore(
          'foobar1337',
          TEST_SEED,
        );

        const firstVaultAccounts = cloneDeep(
          metamaskController.accountsController.listAccounts(),
        );
        expect(firstVaultAccounts).toHaveLength(1);
        expect(firstVaultAccounts[0].address).toBe(TEST_ADDRESS);

        const selectedAccount =
          metamaskController.accountsController.getSelectedAccount();
        metamaskController.accountsController.setAccountName(
          selectedAccount.id,
          'Account Foo',
        );

        const labelledFirstVaultAccounts = cloneDeep(
          metamaskController.accountsController.listAccounts(),
        );

        expect(labelledFirstVaultAccounts[0].address).toBe(TEST_ADDRESS);
        expect(labelledFirstVaultAccounts[0].metadata.name).toBe('Account Foo');

        await metamaskController.createNewVaultAndRestore(
          'foobar1337',
          TEST_SEED_ALT,
        );

        const secondVaultAccounts = cloneDeep(
          metamaskController.accountsController.listAccounts(),
        );

        expect(secondVaultAccounts).toHaveLength(1);
        expect(
          metamaskController.accountsController.getSelectedAccount().address,
        ).toBe(TEST_ADDRESS_ALT);
        expect(secondVaultAccounts[0].address).toBe(TEST_ADDRESS_ALT);
        expect(secondVaultAccounts[0].metadata.name).toBe(DEFAULT_LABEL);
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

        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({ completedOnboarding: true });

        // Give account 2 a token
        jest
          .spyOn(metamaskController.tokensController, 'state', 'get')
          .mockReturnValue({
            allTokens: {},
            allIgnoredTokens: {},
            allDetectedTokens: { '0x1': { [TEST_ADDRESS_2]: [{}] } },
          });

        await metamaskController.createNewVaultAndRestore(
          'foobar1337',
          TEST_SEED,
        );

        // Expect first account to be selected
        const accounts = cloneDeep(
          metamaskController.accountsController.listAccounts(),
        );

        const selectedAccount =
          metamaskController.accountsController.getSelectedAccount();

        expect(selectedAccount.address).toBe(TEST_ADDRESS);
        expect(accounts).toHaveLength(2);
        expect(accounts[0].address).toBe(TEST_ADDRESS);
        expect(accounts[0].metadata.name).toBe(DEFAULT_LABEL);
        expect(accounts[1].address).toBe(TEST_ADDRESS_2);
        expect(accounts[1].metadata.name).toBe('Account 2');
        // TODO: Handle last selected in the update of the next accounts controller.
        // expect(accounts[1].metadata.lastSelected).toBeGreaterThan(
        //   accounts[0].metadata.lastSelected,
        // );
      });
    });

    describe('#getBalance', () => {
      it('should return the balance known by accountTrackerController', async () => {
        const accounts = {};
        const balance = '0x14ced5122ce0a000';
        accounts[TEST_ADDRESS] = { balance };

        jest
          .spyOn(metamaskController.accountTrackerController, 'state', 'get')
          .mockReturnValue({
            accounts,
          });

        const gotten = await metamaskController.getBalance(TEST_ADDRESS);

        expect(balance).toStrictEqual(gotten);
      });

      it('should ask the network for a balance when not known by accountTrackerController', async () => {
        const accounts = {};
        const balance = '0x14ced5122ce0a000';
        const ethQuery = new EthQuery();
        jest.spyOn(ethQuery, 'getBalance').mockImplementation((_, callback) => {
          callback(undefined, balance);
        });

        jest
          .spyOn(metamaskController.accountTrackerController, 'state', 'get')
          .mockReturnValue({
            accounts,
          });

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

    describe('hardware keyrings', () => {
      beforeEach(async () => {
        await metamaskController.createNewVaultAndKeychain('test@123');
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

        it('should add the Trezor Hardware keyring and return the first page of accounts', async () => {
          jest.spyOn(metamaskController.keyringController, 'addNewKeyring');

          const firstPage = await metamaskController.connectHardware(
            HardwareDeviceNames.trezor,
            0,
          );

          expect(
            metamaskController.keyringController.addNewKeyring,
          ).toHaveBeenCalledWith(KeyringType.trezor);
          expect(
            metamaskController.keyringController.state.keyrings[1].type,
          ).toBe(TrezorKeyring.type);
          expect(firstPage).toStrictEqual(KNOWN_PUBLIC_KEY_ADDRESSES);
        });

        it('should add the Ledger Hardware keyring and return the first page of accounts', async () => {
          jest.spyOn(metamaskController.keyringController, 'addNewKeyring');

          const firstPage = await metamaskController.connectHardware(
            HardwareDeviceNames.ledger,
            0,
          );

          expect(
            metamaskController.keyringController.addNewKeyring,
          ).toHaveBeenCalledWith(KeyringType.ledger);
          expect(
            metamaskController.keyringController.state.keyrings[1].type,
          ).toBe(LedgerKeyring.type);
          expect(firstPage).toStrictEqual(KNOWN_PUBLIC_KEY_ADDRESSES);
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

        [HardwareDeviceNames.trezor, HardwareDeviceNames.ledger].forEach(
          (device) => {
            describe(`using ${device}`, () => {
              it('should be unlocked by default', async () => {
                await metamaskController.connectHardware(device, 0);

                const status = await metamaskController.checkHardwareStatus(
                  device,
                );

                expect(status).toStrictEqual(true);
              });
            });
          },
        );
      });

      describe('getHardwareDeviceName', () => {
        const hdPath = "m/44'/60'/0'/0/0";

        it('should return the correct device name for Ledger', async () => {
          const deviceName = 'ledger';

          const result = await metamaskController.getDeviceNameForMetric(
            deviceName,
            hdPath,
          );
          expect(result).toBe('ledger');
        });

        it('should return the correct device name for Lattice', async () => {
          const deviceName = 'lattice';

          const result = await metamaskController.getDeviceNameForMetric(
            deviceName,
            hdPath,
          );
          expect(result).toBe('lattice');
        });

        it('should return the correct device name for Trezor', async () => {
          const deviceName = 'trezor';
          jest
            .spyOn(metamaskController, 'getKeyringForDevice')
            .mockResolvedValue({
              bridge: {
                minorVersion: 1,
                model: 'T',
              },
            });
          const result = await metamaskController.getDeviceNameForMetric(
            deviceName,
            hdPath,
          );
          expect(result).toBe('trezor');
        });

        it('should return undefined for unknown device name', async () => {
          const deviceName = 'unknown';
          const result = await metamaskController.getDeviceNameForMetric(
            deviceName,
            hdPath,
          );
          expect(result).toBe(deviceName);
        });

        it('should handle special case for OneKeyDevice via Trezor', async () => {
          const deviceName = 'trezor';
          jest
            .spyOn(metamaskController, 'getKeyringForDevice')
            .mockResolvedValue({
              bridge: {
                model: 'T',
                minorVersion: ONE_KEY_VIA_TREZOR_MINOR_VERSION,
              },
            });
          const result = await metamaskController.getDeviceNameForMetric(
            deviceName,
            hdPath,
          );
          expect(result).toBe('OneKey via Trezor');
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
          await metamaskController.connectHardware(
            HardwareDeviceNames.trezor,
            0,
          );
          await metamaskController.unlockHardwareWalletAccount(
            0,
            HardwareDeviceNames.trezor,
          );
          const hardwareKeyringAccount =
            metamaskController.keyringController.state.keyrings[1].accounts[0];

          await metamaskController.forgetDevice(HardwareDeviceNames.trezor);

          expect(
            Object.keys(
              metamaskController.preferencesController.state.identities,
            ),
          ).not.toContain(hardwareKeyringAccount);
          expect(
            metamaskController.accountsController
              .listAccounts()
              .some((account) => account.address === hardwareKeyringAccount),
          ).toStrictEqual(false);
        });

        it('should wipe all the keyring info', async () => {
          await metamaskController.connectHardware(
            HardwareDeviceNames.trezor,
            0,
          );

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
        const accountToUnlock = 0;

        [HardwareDeviceNames.trezor, HardwareDeviceNames.ledger].forEach(
          (device) => {
            describe(`using ${device}`, () => {
              beforeEach(async () => {
                await metamaskController.connectHardware(device, 0);
              });

              it('should return the unlocked account', async () => {
                const { unlockedAccount } =
                  await metamaskController.unlockHardwareWalletAccount(
                    accountToUnlock,
                    device,
                  );

                expect(unlockedAccount).toBe(
                  KNOWN_PUBLIC_KEY_ADDRESSES[
                    accountToUnlock
                  ].address.toLowerCase(),
                );
              });

              it('should add the unlocked account to KeyringController', async () => {
                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.keyringController.state.keyrings[1]
                    .accounts,
                ).toStrictEqual([
                  KNOWN_PUBLIC_KEY_ADDRESSES[
                    accountToUnlock
                  ].address.toLowerCase(),
                ]);
              });

              it('should call keyringController.addNewAccountForKeyring', async () => {
                jest.spyOn(
                  metamaskController.keyringController,
                  'addNewAccountForKeyring',
                );

                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.keyringController.addNewAccountForKeyring,
                ).toHaveBeenCalledTimes(1);
              });

              it('should call preferencesController.setSelectedAddress', async () => {
                jest.spyOn(
                  metamaskController.preferencesController,
                  'setSelectedAddress',
                );

                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.preferencesController.setSelectedAddress,
                ).toHaveBeenCalledTimes(1);
              });

              it('should call preferencesController.setAccountLabel', async () => {
                jest.spyOn(
                  metamaskController.preferencesController,
                  'setAccountLabel',
                );

                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.preferencesController.setAccountLabel,
                ).toHaveBeenCalledTimes(1);
              });

              it('should call accountsController.getAccountByAddress', async () => {
                jest.spyOn(
                  metamaskController.accountsController,
                  'getAccountByAddress',
                );

                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.accountsController.getAccountByAddress,
                ).toHaveBeenCalledTimes(1);
              });

              it('should call accountsController.setAccountName', async () => {
                jest.spyOn(
                  metamaskController.accountsController,
                  'setAccountName',
                );

                await metamaskController.unlockHardwareWalletAccount(
                  accountToUnlock,
                  device,
                );

                expect(
                  metamaskController.accountsController.setAccountName,
                ).toHaveBeenCalledTimes(1);
              });
            });
          },
        );
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
        jest.spyOn(
          metamaskController.smartTransactionsController,
          'wipeSmartTransactions',
        );

        await metamaskController.resetAccount();

        expect(
          metamaskController.txController.wipeTransactions,
        ).toHaveBeenCalledTimes(1);
        expect(
          metamaskController.smartTransactionsController.wipeSmartTransactions,
        ).toHaveBeenCalledTimes(1);
        expect(
          metamaskController.txController.wipeTransactions,
        ).toHaveBeenCalledWith(false, selectedAddressMock);
        expect(
          metamaskController.smartTransactionsController.wipeSmartTransactions,
        ).toHaveBeenCalledWith({
          address: selectedAddressMock,
          ignoreNetwork: false,
        });
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
    describe('#setupPhishingCommunication', () => {
      beforeEach(() => {
        jest.spyOn(metamaskController, 'safelistPhishingDomain');
        jest.spyOn(metamaskController, 'backToSafetyPhishingWarning');
        metamaskController.preferencesController.setUsePhishDetect(true);
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      it('creates a phishing stream with safelistPhishingDomain and backToSafetyPhishingWarning handler', async () => {
        const safelistPhishingDomainRequest = {
          name: 'metamask-phishing-safelist',
          data: {
            id: 1,
            method: 'safelistPhishingDomain',
            params: ['mockHostname'],
          },
        };
        const backToSafetyPhishingWarningRequest = {
          name: 'metamask-phishing-safelist',
          data: { id: 2, method: 'backToSafetyPhishingWarning', params: [] },
        };

        const { promise, resolve } = deferredPromise();
        const { promise: promiseStream, resolve: resolveStream } =
          deferredPromise();
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk.name !== 'metamask-phishing-safelist') {
            cb();
            return;
          }
          resolve();
          cb(null, chunk);
        });

        metamaskController.setupPhishingCommunication({
          connectionStream: streamTest,
        });

        streamTest.write(safelistPhishingDomainRequest, null, () => {
          expect(
            metamaskController.safelistPhishingDomain,
          ).toHaveBeenCalledWith('mockHostname');
        });
        streamTest.write(backToSafetyPhishingWarningRequest, null, () => {
          expect(
            metamaskController.backToSafetyPhishingWarning,
          ).toHaveBeenCalled();
          resolveStream();
        });

        await promise;
        streamTest.end();
        await promiseStream;
      });
    });

    describe('#setUpCookieHandlerCommunication', () => {
      let localMetaMaskController;
      beforeEach(() => {
        localMetaMaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            MetaMetricsController: {
              metaMetricsId: 'MOCK_METRICS_ID',
              participateInMetaMetrics: true,
              dataCollectionForMarketing: true,
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
        jest.spyOn(localMetaMaskController, 'getCookieFromMarketingPage');
      });
      afterEach(() => {
        jest.clearAllMocks();
      });
      it('creates a cookie handler communication stream with getCookieFromMarketingPage handler', async () => {
        const attributionRequest = {
          name: METAMASK_COOKIE_HANDLER,
          data: {
            id: 1,
            method: 'getCookieFromMarketingPage',
            params: [{ ga_client_id: 'XYZ.ABC' }],
          },
        };

        const { promise, resolve } = deferredPromise();
        const { promise: promiseStream, resolve: resolveStream } =
          deferredPromise();
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk.name !== METAMASK_COOKIE_HANDLER) {
            cb();
            return;
          }
          resolve();
          cb(null, chunk);
        });

        localMetaMaskController.setUpCookieHandlerCommunication({
          connectionStream: streamTest,
        });

        streamTest.write(attributionRequest, null, () => {
          expect(
            localMetaMaskController.getCookieFromMarketingPage,
          ).toHaveBeenCalledWith({ ga_client_id: 'XYZ.ABC' });
          resolveStream();
        });

        await promise;
        streamTest.end();
        await promiseStream;
      });
    });

    describe('#setupUntrustedCommunicationEip1193', () => {
      const mockTxParams = { from: TEST_ADDRESS };

      beforeEach(() => {
        initializeMockMiddlewareLog();
        metamaskController.preferencesController.setSecurityAlertsEnabled(
          false,
        );
        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({ completedOnboarding: true });
        metamaskController.preferencesController.setUsePhishDetect(true);
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
        const streamTest = createThroughStream((chunk, _, cb) => {
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

        metamaskController.setupUntrustedCommunicationEip1193({
          connectionStream: streamTest,
          sender: phishingMessageSender,
        });
        await promise;
        streamTest.end();
      });

      it('checks the sender hostname with the phishing controller', async () => {
        jest
          .spyOn(metamaskController.phishingController, 'maybeUpdateState')
          .mockReturnValue();

        jest
          .spyOn(metamaskController.phishingController, 'test')
          .mockReturnValue({ result: 'mock' });

        jest.spyOn(metamaskController, 'sendPhishingWarning').mockReturnValue();
        const phishingMessageSender = {
          url: 'http://test.metamask-phishing.io',
          tab: {},
        };

        const { resolve } = deferredPromise();
        const streamTest = createThroughStream((chunk, _, cb) => {
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

        metamaskController.setupUntrustedCommunicationEip1193({
          connectionStream: streamTest,
          sender: phishingMessageSender,
        });

        expect(
          metamaskController.phishingController.maybeUpdateState,
        ).toHaveBeenCalled();
        expect(metamaskController.phishingController.test).toHaveBeenCalled();
        expect(metamaskController.sendPhishingWarning).toHaveBeenCalledWith(
          expect.anything(),
          'test.metamask-phishing.io',
        );
      });

      it('adds a tabId, origin and networkClient to requests', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
          tab: { id: 456 },
        };
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk.data && chunk.data.method) {
            cb(null, chunk);
            return;
          }
          cb();
        });

        metamaskController.setupUntrustedCommunicationEip1193({
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
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk.data && chunk.data.method) {
            cb(null, chunk);
            return;
          }
          cb();
        });

        metamaskController.setupUntrustedCommunicationEip1193({
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

      it.todo(
        'should only process `metamask-provider` multiplex formatted messages',
      );
    });

    describe('#setupUntrustedCommunicationCaip', () => {
      it.todo('should only process `caip-x` CAIP formatted messages');
    });

    describe('#setupTrustedCommunication', () => {
      it('sets up controller JSON-RPC api for trusted communication', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
          tab: {},
        };
        const { promise, resolve } = deferredPromise();
        const streamTest = createThroughStream((chunk, _, cb) => {
          expect(chunk.name).toStrictEqual('controller');
          resolve();
          cb();
        });

        metamaskController.setupTrustedCommunication(streamTest, messageSender);

        await promise;
        streamTest.end();
      });

      it('uses a new multiplex to set up a connection', () => {
        jest.spyOn(metamaskController, 'setupControllerConnection');

        const streamTest = createThroughStream((chunk, _, cb) => {
          cb(chunk);
        });

        metamaskController.setupTrustedCommunication(streamTest, {});

        expect(metamaskController.setupControllerConnection).toHaveBeenCalled();
        expect(
          metamaskController.setupControllerConnection,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            _name: 'controller',
            _parent: expect.any(ObjectMultiplex),
          }),
        );
      });

      const createTestStream = () => {
        const {
          promise: onFinishedCallbackPromise,
          resolve: onFinishedCallbackResolve,
        } = deferredPromise();
        const { promise: onStreamEndPromise, resolve: onStreamEndResolve } =
          deferredPromise();
        const testStream = createThroughStream((chunk, _, cb) => {
          expect(chunk.name).toStrictEqual('controller');
          onStreamEndResolve();
          cb();
        });

        return {
          onFinishedCallbackPromise,
          onStreamEndPromise,
          onFinishedCallbackResolve,
          testStream,
        };
      };

      it('sets up a controller connection which emits a controllerConnectionChanged event when the controller connection is created and ended, and activeControllerConnections are updated accordingly', async () => {
        const mockControllerConnectionChangedHandler = jest.fn();

        const {
          onStreamEndPromise,
          onFinishedCallbackPromise,
          onFinishedCallbackResolve,
          testStream,
        } = createTestStream();

        metamaskController.on(
          'controllerConnectionChanged',
          (activeControllerConnections) => {
            mockControllerConnectionChangedHandler(activeControllerConnections);
            if (
              mockControllerConnectionChangedHandler.mock.calls.length === 2
            ) {
              onFinishedCallbackResolve();
            }
          },
        );

        expect(metamaskController.activeControllerConnections).toBe(0);

        metamaskController.setupTrustedCommunication(testStream, {});

        expect(mockControllerConnectionChangedHandler).toHaveBeenCalledTimes(1);
        expect(mockControllerConnectionChangedHandler).toHaveBeenLastCalledWith(
          1,
        );

        expect(metamaskController.activeControllerConnections).toBe(1);

        await onStreamEndPromise;
        testStream.end();

        await onFinishedCallbackPromise;

        expect(metamaskController.activeControllerConnections).toBe(0);
        expect(mockControllerConnectionChangedHandler).toHaveBeenCalledTimes(2);
        expect(mockControllerConnectionChangedHandler).toHaveBeenLastCalledWith(
          0,
        );
      });

      it('can be called multiple times to set up multiple controller connections, which can be ended independently', async () => {
        const mockControllerConnectionChangedHandler = jest.fn();

        const testStreams = [
          createTestStream(),
          createTestStream(),
          createTestStream(),
          createTestStream(),
          createTestStream(),
        ];
        metamaskController.on(
          'controllerConnectionChanged',
          (activeControllerConnections) => {
            const initialChangeHandlerCallCount =
              mockControllerConnectionChangedHandler.mock.calls.length;
            mockControllerConnectionChangedHandler(activeControllerConnections);

            if (
              initialChangeHandlerCallCount === 5 &&
              activeControllerConnections === 4
            ) {
              testStreams[1].onFinishedCallbackResolve();
            }
            if (
              initialChangeHandlerCallCount === 7 &&
              activeControllerConnections === 2
            ) {
              testStreams[3].onFinishedCallbackResolve();
              testStreams[4].onFinishedCallbackResolve();
            }
            if (
              initialChangeHandlerCallCount === 9 &&
              activeControllerConnections === 0
            ) {
              testStreams[2].onFinishedCallbackResolve();
              testStreams[0].onFinishedCallbackResolve();
            }
          },
        );

        metamaskController.setupTrustedCommunication(
          testStreams[0].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[1].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[2].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[3].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[4].testStream,
          {},
        );

        expect(metamaskController.activeControllerConnections).toBe(5);

        await testStreams[1].promise;
        testStreams[1].testStream.end();

        await testStreams[1].onFinishedCallbackPromise;

        expect(metamaskController.activeControllerConnections).toBe(4);

        await testStreams[3].promise;
        testStreams[3].testStream.end();

        await testStreams[4].promise;
        testStreams[4].testStream.end();

        await testStreams[3].onFinishedCallbackPromise;
        await testStreams[4].onFinishedCallbackPromise;

        expect(metamaskController.activeControllerConnections).toBe(2);

        await testStreams[2].promise;
        testStreams[2].testStream.end();

        await testStreams[0].promise;
        testStreams[0].testStream.end();

        await testStreams[2].onFinishedCallbackPromise;
        await testStreams[0].onFinishedCallbackPromise;

        expect(metamaskController.activeControllerConnections).toBe(0);
      });

      // this test could be improved by testing for actual behavior of handlers,
      // without touching rawListeners from test
      it('attaches listeners for trusted communication streams and removes them as streams close', async () => {
        jest
          .spyOn(metamaskController, 'triggerNetworkrequests')
          .mockImplementation();
        jest
          .spyOn(metamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({ completedOnboarding: true });
        const mockControllerConnectionChangedHandler = jest.fn();

        const testStreams = [
          createTestStream(),
          createTestStream(2),
          createTestStream(3),
          createTestStream(4),
          createTestStream(5),
        ];
        const baseUpdateListenerCount =
          metamaskController.rawListeners('update').length;

        metamaskController.on(
          'controllerConnectionChanged',
          (activeControllerConnections) => {
            const initialChangeHandlerCallCount =
              mockControllerConnectionChangedHandler.mock.calls.length;
            mockControllerConnectionChangedHandler(activeControllerConnections);
            if (
              initialChangeHandlerCallCount === 8 &&
              activeControllerConnections === 1
            ) {
              testStreams[1].onFinishedCallbackResolve();
              testStreams[3].onFinishedCallbackResolve();
              testStreams[4].onFinishedCallbackResolve();
              testStreams[2].onFinishedCallbackResolve();
            }
            if (
              initialChangeHandlerCallCount === 9 &&
              activeControllerConnections === 0
            ) {
              testStreams[0].onFinishedCallbackResolve();
            }
          },
        );

        metamaskController.setupTrustedCommunication(
          testStreams[0].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[1].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[2].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[3].testStream,
          {},
        );
        metamaskController.setupTrustedCommunication(
          testStreams[4].testStream,
          {},
        );

        await testStreams[1].promise;

        expect(metamaskController.rawListeners('update')).toHaveLength(
          baseUpdateListenerCount + 5,
        );

        testStreams[1].testStream.end();
        await testStreams[3].promise;
        testStreams[3].testStream.end();
        testStreams[3].testStream.end();

        await testStreams[4].promise;
        testStreams[4].testStream.end();
        await testStreams[2].promise;
        testStreams[2].testStream.end();
        await testStreams[1].onFinishedCallbackPromise;
        await testStreams[3].onFinishedCallbackPromise;
        await testStreams[4].onFinishedCallbackPromise;
        await testStreams[2].onFinishedCallbackPromise;
        expect(metamaskController.rawListeners('update')).toHaveLength(
          baseUpdateListenerCount + 1,
        );

        await testStreams[0].promise;
        testStreams[0].testStream.end();

        await testStreams[0].onFinishedCallbackPromise;

        expect(metamaskController.rawListeners('update')).toHaveLength(
          baseUpdateListenerCount,
        );
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
      const accounts = [
        '0x603E83442BA54A2d0E080c34D6908ec228bef59f',
        '0xDe95cE6E727692286E02A931d074efD1E5E2f03c',
      ];

      it('should do nothing if there are no keyrings in state', async () => {
        jest
          .spyOn(
            metamaskController.accountTrackerController,
            'syncWithAddresses',
          )
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({ keyrings: [] });

        expect(
          metamaskController.accountTrackerController.syncWithAddresses,
        ).not.toHaveBeenCalled();
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });

      it('should sync addresses if there are keyrings in state', async () => {
        jest
          .spyOn(
            metamaskController.accountTrackerController,
            'syncWithAddresses',
          )
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          keyrings: [
            {
              accounts,
            },
          ],
        });

        expect(
          metamaskController.accountTrackerController.syncWithAddresses,
        ).toHaveBeenCalledWith(accounts);
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });

      it('should NOT update selected address if already unlocked', async () => {
        jest
          .spyOn(
            metamaskController.accountTrackerController,
            'syncWithAddresses',
          )
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          isUnlocked: true,
          keyrings: [
            {
              accounts,
            },
          ],
        });

        expect(
          metamaskController.accountTrackerController.syncWithAddresses,
        ).toHaveBeenCalledWith(accounts);
        expect(metamaskController.getState()).toStrictEqual(oldState);
      });

      it('filter out non-EVM addresses prior to calling syncWithAddresses', async () => {
        jest
          .spyOn(
            metamaskController.accountTrackerController,
            'syncWithAddresses',
          )
          .mockReturnValue();

        const oldState = metamaskController.getState();
        await metamaskController._onKeyringControllerUpdate({
          keyrings: [
            {
              accounts: [
                ...accounts,
                // Non-EVM address which should not be used by syncWithAddresses
                'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
              ],
            },
          ],
        });

        expect(
          metamaskController.accountTrackerController.syncWithAddresses,
        ).toHaveBeenCalledWith(accounts);
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
          symbol: 'FOO',
        };

        await metamaskController.tokensController.addTokens([
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            ...tokenData,
          },
        ]);

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

        await simulatePreferencesChange({
          incomingTransactionsPreferences: {
            [MAINNET_CHAIN_ID]: true,
          },
        });

        expect(
          TransactionController.prototype.startIncomingTransactionPolling,
        ).toHaveBeenCalledTimes(1);
      });

      it('stops incoming transaction polling if incomingTransactionsPreferences is disabled for that chainId', async () => {
        expect(
          TransactionController.prototype.stopIncomingTransactionPolling,
        ).not.toHaveBeenCalled();

        await simulatePreferencesChange({
          incomingTransactionsPreferences: {
            [MAINNET_CHAIN_ID]: false,
          },
        });

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

    describe('MultichainRatesController start/stop', () => {
      const mockEvmAccount = createMockInternalAccount();
      const mockNonEvmAccount = {
        ...mockEvmAccount,
        id: '21690786-6abd-45d8-a9f0-9ff1d8ca76a1',
        type: BtcAccountType.P2wpkh,
        methods: [BtcMethod.SendBitcoin],
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      };

      beforeEach(() => {
        jest.spyOn(metamaskController.multichainRatesController, 'start');
        jest.spyOn(metamaskController.multichainRatesController, 'stop');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('starts MultichainRatesController if selected account is changed to non-EVM', async () => {
        expect(
          metamaskController.multichainRatesController.start,
        ).not.toHaveBeenCalled();

        metamaskController.controllerMessenger.publish(
          'AccountsController:selectedAccountChange',
          mockNonEvmAccount,
        );

        expect(
          metamaskController.multichainRatesController.start,
        ).toHaveBeenCalledTimes(1);
      });

      it('stops MultichainRatesController if selected account is changed to EVM', async () => {
        expect(
          metamaskController.multichainRatesController.start,
        ).not.toHaveBeenCalled();

        metamaskController.controllerMessenger.publish(
          'AccountsController:selectedAccountChange',
          mockNonEvmAccount,
        );

        expect(
          metamaskController.multichainRatesController.start,
        ).toHaveBeenCalledTimes(1);

        metamaskController.controllerMessenger.publish(
          'AccountsController:selectedAccountChange',
          mockEvmAccount,
        );
        expect(
          metamaskController.multichainRatesController.start,
        ).toHaveBeenCalledTimes(1);
        expect(
          metamaskController.multichainRatesController.stop,
        ).toHaveBeenCalledTimes(1);
      });

      it('does not start MultichainRatesController if selected account is changed to EVM', async () => {
        expect(
          metamaskController.multichainRatesController.start,
        ).not.toHaveBeenCalled();

        metamaskController.controllerMessenger.publish(
          'AccountsController:selectedAccountChange',
          mockEvmAccount,
        );

        expect(
          metamaskController.multichainRatesController.start,
        ).not.toHaveBeenCalled();
      });

      it('starts MultichainRatesController if selected account is non-EVM account during initialization', async () => {
        jest.spyOn(RatesController.prototype, 'start');
        const localMetamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            AccountsController: {
              internalAccounts: {
                accounts: {
                  [mockNonEvmAccount.id]: mockNonEvmAccount,
                  [mockEvmAccount.id]: mockEvmAccount,
                },
                selectedAccount: mockNonEvmAccount.id,
              },
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

        expect(
          localMetamaskController.multichainRatesController.start,
        ).toHaveBeenCalled();
      });
    });

    describe('MultichainBalancesController', () => {
      const mockEvmAccount = createMockInternalAccount();
      const mockNonEvmAccount = {
        ...mockEvmAccount,
        id: '21690786-6abd-45d8-a9f0-9ff1d8ca76a1',
        type: BtcAccountType.P2wpkh,
        methods: [BtcMethod.SendBitcoin],
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        // We need to have a "Snap account" account here, since the MultichainBalancesController will
        // filter it out otherwise!
        metadata: {
          name: 'Bitcoin Account',
          importTime: Date.now(),
          keyring: {
            type: KeyringType.snap,
          },
          snap: {
            id: 'npm:@metamask/bitcoin-wallet-snap',
          },
        },
      };
      let localMetamaskController;
      let spyBalancesTrackerUpdateBalance;

      beforeEach(() => {
        jest.useFakeTimers();
        jest.spyOn(MultichainBalancesController.prototype, 'updateBalances');
        jest
          .spyOn(MultichainBalancesController.prototype, 'updateBalance')
          .mockResolvedValue();
        spyBalancesTrackerUpdateBalance = jest
          .spyOn(MultichainBalancesTracker.prototype, 'updateBalance')
          .mockResolvedValue();
        localMetamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            AccountsController: {
              internalAccounts: {
                accounts: {
                  [mockNonEvmAccount.id]: mockNonEvmAccount,
                  [mockEvmAccount.id]: mockEvmAccount,
                },
                selectedAccount: mockNonEvmAccount.id,
              },
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
      });

      afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
      });

      it('calls updateBalances during startup', async () => {
        expect(
          localMetamaskController.multichainBalancesController.updateBalances,
        ).toHaveBeenCalled();
      });

      it('calls updateBalances after the interval has passed', async () => {
        // 1st call is during startup:
        // updatesBalances is going to call updateBalance for the only non-EVM
        // account that we have
        expect(
          localMetamaskController.multichainBalancesController.updateBalances,
        ).toHaveBeenCalledTimes(1);
        expect(spyBalancesTrackerUpdateBalance).toHaveBeenCalledTimes(1);
        expect(spyBalancesTrackerUpdateBalance).toHaveBeenCalledWith(
          mockNonEvmAccount.id,
        );

        // Wait for "block time", so balances will have to be refreshed
        jest.advanceTimersByTime(MULTICHAIN_BALANCES_UPDATE_TIME);

        // Check that we tried to fetch the balances more than once
        // NOTE: For now, this method might be called a lot more than just twice, but this
        // method has some internal logic to prevent fetching the balance too often if we
        // consider the balance to be "up-to-date"
        expect(
          spyBalancesTrackerUpdateBalance.mock.calls.length,
        ).toBeGreaterThan(1);
        expect(spyBalancesTrackerUpdateBalance).toHaveBeenLastCalledWith(
          mockNonEvmAccount.id,
        );
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
