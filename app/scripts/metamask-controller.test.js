/**
 * @jest-environment node
 */
import { cloneDeep } from 'lodash';
import nock from 'nock';
import { obj as createThroughStream } from 'through2';
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
  BtcScope,
  EthAccountType,
  SolScope,
} from '@metamask/keyring-api';
import { Messenger } from '@metamask/base-controller';
import { LoggingController, LogType } from '@metamask/logging-controller';
import {
  CHAIN_IDS,
  TransactionController,
} from '@metamask/transaction-controller';
import {
  RatesController,
  TokenListController,
} from '@metamask/assets-controllers';
import ObjectMultiplex from '@metamask/object-multiplex';
import { TrezorKeyring } from '@metamask/eth-trezor-keyring';
import { LedgerKeyring } from '@metamask/eth-ledger-bridge-keyring';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { PermissionDoesNotExistError } from '@metamask/permission-controller';
import { KeyringInternalSnapClient } from '@metamask/keyring-internal-snap-client';

import { createTestProviderTools } from '../../test/stub/provider';
import {
  HardwareDeviceNames,
  HardwareKeyringType,
} from '../../shared/constants/hardware-wallets';
import { KeyringType } from '../../shared/constants/keyring';
import { LOG_EVENT } from '../../shared/constants/logs';
import mockEncryptor from '../../test/lib/mock-encryptor';
import * as tokenUtils from '../../shared/lib/token-util';
import { flushPromises } from '../../test/lib/timer-helpers';
import { ETH_EOA_METHODS } from '../../shared/constants/eth-methods';
import { createMockInternalAccount } from '../../test/jest/mocks';
import { mockNetworkState } from '../../test/stub/networks';
import { ENVIRONMENT } from '../../development/build/constants';
import { SECOND } from '../../shared/constants/time';
import * as NetworkConstantsModule from '../../shared/constants/network';
import { withResolvers } from '../../shared/lib/promise-with-resolvers';
import { METAMASK_COOKIE_HANDLER } from './constants/stream';
import MetaMaskController from './metamask-controller';

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

const mockULIDs = [
  '01JKAF3DSGM3AB87EM9N0K41AJ',
  '01JKAF3KP7VPAG0YXEDTDRB6ZV',
  '01JKAF3KP7VPAG0YXEDTDRB6ZW',
  '01JKAF3KP7VPAG0YXEDTDRB6ZX',
];

function* ulidGenerator(ulids = mockULIDs) {
  for (const id of ulids) {
    yield id;
  }
  throw new Error('should not be called after exhausting provided IDs');
}

/**
 * Generate mock patches for a complete state replacement.
 *
 * @returns A list of mock patches.
 */
function getMockPatches() {
  return [{ op: 'replace', path: [], value: {} }];
}

let mockUlidGenerator = ulidGenerator();

jest.mock('ulid', () => ({
  ulid: jest.fn().mockImplementation(() => mockUlidGenerator.next().value),
}));

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

jest.mock('./controllers/permissions/specifications', () => ({
  ...jest.requireActual('./controllers/permissions/specifications'),
  validateCaveatAccounts: jest.fn(),
  validateCaveatNetworks: jest.fn(),
}));

jest.mock('./lib/createLoggerMiddleware', () => createLoggerMiddlewareMock);

jest.mock('./lib/rpc-method-middleware', () => ({
  ...jest.requireActual('./lib/rpc-method-middleware'),
  createEip1193MethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
  createEthAccountsMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
  createMultichainMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
  createUnsupportedMethodMiddleware: () => (_req, _res, next, _end) => {
    next();
  },
}));

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
    destroy: jest.fn(),
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
    address: KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
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

function createMockCronjobControllerStorageManager() {
  return {
    init: noop,
    getInitialState: noop,
    set: noop,
  };
}

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

    // Re-create the ULID generator to start over again the `mockULIDs` list.
    mockUlidGenerator = ulidGenerator();
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

    beforeEach(() => {
      jest.spyOn(MetaMaskController.prototype, 'resetStates');

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

      jest.spyOn(Messenger.prototype, 'subscribe');
      jest.spyOn(TokenListController.prototype, 'start');
      jest.spyOn(TokenListController.prototype, 'stop');
      jest.spyOn(TokenListController.prototype, 'clearingTokenListData');

      metamaskController = new MetaMaskController({
        showUserConfirmation: noop,
        encryptor: mockEncryptor,
        initState: {
          ...cloneDeep(firstTimeState),
          PreferencesController: {
            useExternalServices: false,
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
        cronjobControllerStorageManager:
          createMockCronjobControllerStorageManager(),
      });

      jest.spyOn(
        metamaskController.keyringController,
        'createNewVaultAndKeychain',
      );
      jest.spyOn(
        metamaskController.keyringController,
        'createNewVaultAndRestore',
      );
      jest.spyOn(
        metamaskController.seedlessOnboardingController,
        'authenticate',
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
          platform: {
            _showNotification: jest.fn(),
          },
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
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
        const transactionOptions = {
          foo: true,
          networkClientId: NETWORK_CONFIGURATION_ID_1,
        };
        const result = metamaskController.getAddTransactionRequest({
          transactionParams,
          transactionOptions,
        });
        expect(result).toStrictEqual({
          internalAccounts:
            metamaskController.accountsController.listAccounts(),
          dappRequest: undefined,
          networkClientId: NETWORK_CONFIGURATION_ID_1,
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
          getSecurityAlertResponse: expect.any(Function),
          addSecurityAlertResponse: expect.any(Function),
          getSecurityAlertsConfig: expect.any(Function),
        });
      });
      it('passes through any additional params to the object', () => {
        const transactionParams = { from: '0xa', to: '0xb' };
        const transactionOptions = {
          foo: true,
          networkClientId: NETWORK_CONFIGURATION_ID_1,
        };
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
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
        await metamaskController.createNewVaultAndKeychain('password');
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

        const vault1 =
          await metamaskController.createNewVaultAndKeychain(password);
        const vault2 =
          await metamaskController.createNewVaultAndKeychain(password);

        expect(vault1).toStrictEqual(vault2);
      });
    });

    describe('#createSeedPhraseBackup', () => {
      it('should create a seed phrase backup', async () => {
        const password = 'a-fake-password';
        const mockSeedPhrase =
          'mock seed phrase one two three four five six seven eight nine ten';
        const mockEncodedSeedPhrase = Array.from(
          Buffer.from(mockSeedPhrase, 'utf8').values(),
        );

        const createToprfKeyAndBackupSeedPhraseSpy = jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'createToprfKeyAndBackupSeedPhrase',
          )
          .mockResolvedValueOnce();
        const storeKeyringEncryptionKey = jest
          .spyOn(
            metamaskController.seedlessOnboardingController,
            'storeKeyringEncryptionKey',
          )
          .mockResolvedValueOnce();

        const primaryKeyring =
          await metamaskController.createNewVaultAndKeychain(password);

        await metamaskController.createSeedPhraseBackup(
          password,
          mockEncodedSeedPhrase,
          primaryKeyring.metadata.id,
        );

        const keyringEncryptionKey =
          await metamaskController.keyringController.exportEncryptionKey();

        expect(createToprfKeyAndBackupSeedPhraseSpy).toHaveBeenCalled();
        expect(storeKeyringEncryptionKey).toHaveBeenCalledWith(
          keyringEncryptionKey,
        );
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

        const mockSnapKeyring = {
          createAccount: jest
            .fn()
            .mockResolvedValue({ address: 'mockedAddress' }),
        };

        const originalGetKeyringsByType =
          metamaskController.keyringController.getKeyringsByType;
        let snapKeyringCallCount = 0;
        jest
          .spyOn(metamaskController.keyringController, 'getKeyringsByType')
          .mockImplementation((type) => {
            if (type === 'Snap Keyring') {
              snapKeyringCallCount += 1;

              if (snapKeyringCallCount === 1) {
                // First call - use original implementation to let controller initialize snap keyring
                return originalGetKeyringsByType.call(
                  metamaskController.keyringController,
                  type,
                );
              }
              // Second call and beyond - return mock
              console.log('returning mocked snap keyring!');
              return [mockSnapKeyring];
            }

            // For other types, always use original implementation
            return originalGetKeyringsByType.call(
              metamaskController.keyringController,
              type,
            );
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
            accountsByChainId: {
              '0x1': {
                [TEST_ADDRESS]: { balance },
              },
            },
          });

        const gotten = await metamaskController.getBalance(TEST_ADDRESS);

        expect(balance).toStrictEqual(gotten);
      });

      it('should ask the network for a balance when not known by accountTrackerController', async () => {
        const accounts = {};
        const balance = '0x14ced5122ce0a000';
        const { provider } = createTestProviderTools({
          scaffold: {
            eth_getBalance: balance,
          },
        });

        jest
          .spyOn(metamaskController.accountTrackerController, 'state', 'get')
          .mockReturnValue({
            accounts,
            accountsByChainId: {
              '0x1': {
                [TEST_ADDRESS]: { balance },
              },
            },
          });

        const gotten = await metamaskController.getBalance(
          TEST_ADDRESS,
          provider,
        );

        expect(balance).toStrictEqual(gotten);
      });
    });

    describe('#getPermittedAccounts', () => {
      it('gets the CAIP-25 caveat value for the origin', async () => {
        const internalAccounts = [
          {
            address: '0xdead',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              lastSelected: 1,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
          {
            address: '0xbeef',
            id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
            metadata: {
              name: 'Test Account',
              lastSelected: 3,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        ];
        jest
          .spyOn(metamaskController.accountsController, 'listAccounts')
          .mockReturnValueOnce(internalAccounts);

        jest
          .spyOn(metamaskController.permissionController, 'getCaveat')
          .mockReturnValue({
            value: {
              requiredScopes: {},
              optionalScopes: {
                'eip155:1': {
                  accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                },
              },
            },
          });

        metamaskController.getPermittedAccounts('test.com');

        expect(
          metamaskController.permissionController.getCaveat,
        ).toHaveBeenCalledWith(
          'test.com',
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
        );
      });

      it('returns empty array if there is no CAIP-25 permission for the origin', async () => {
        jest
          .spyOn(metamaskController.permissionController, 'getCaveat')
          .mockImplementation(() => {
            throw new PermissionDoesNotExistError();
          });

        expect(
          metamaskController.getPermittedAccounts('test.com'),
        ).toStrictEqual([]);
      });

      it('throws an error if getCaveat fails unexpectedly', async () => {
        jest
          .spyOn(metamaskController.permissionController, 'getCaveat')
          .mockImplementation(() => {
            throw new Error('unexpected getCaveat error');
          });

        expect(() => {
          metamaskController.getPermittedAccounts('test.com');
        }).toThrow(new Error(`unexpected getCaveat error`));
      });

      describe('the wallet is locked', () => {
        beforeEach(() => {
          jest.spyOn(metamaskController, 'isUnlocked').mockReturnValue(false);
        });

        it('returns accounts if there is a CAIP-25 permission for the origin', async () => {
          jest
            .spyOn(metamaskController.permissionController, 'getCaveat')
            .mockReturnValue({
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                  },
                },
              },
            });
          jest
            .spyOn(metamaskController, 'sortEvmAccountsByLastSelected')
            .mockReturnValue(['not_empty']);

          expect(
            metamaskController.getPermittedAccounts('test.com'),
          ).toStrictEqual(['not_empty']);
        });
      });

      describe('the wallet is unlocked', () => {
        beforeEach(() => {
          jest.spyOn(metamaskController, 'isUnlocked').mockReturnValue(true);
        });

        it('sorts the eth accounts from the CAIP-25 permission', async () => {
          jest
            .spyOn(metamaskController.permissionController, 'getCaveat')
            .mockReturnValue({
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                  },
                },
              },
            });
          jest
            .spyOn(metamaskController, 'sortEvmAccountsByLastSelected')
            .mockReturnValue([]);

          metamaskController.getPermittedAccounts('test.com');
          expect(
            metamaskController.sortEvmAccountsByLastSelected,
          ).toHaveBeenCalledWith(['0xdead', '0xbeef']);
        });

        it('returns the sorted eth accounts from the CAIP-25 permission', async () => {
          jest
            .spyOn(metamaskController.permissionController, 'getCaveat')
            .mockReturnValue({
              value: {
                requiredScopes: {},
                optionalScopes: {
                  'eip155:1': {
                    accounts: ['eip155:1:0xdead', 'eip155:1:0xbeef'],
                  },
                },
              },
            });
          jest
            .spyOn(metamaskController, 'sortEvmAccountsByLastSelected')
            .mockReturnValue(['0xbeef', '0xdead']);

          expect(
            metamaskController.getPermittedAccounts('test.com'),
          ).toStrictEqual(['0xbeef', '0xdead']);
        });
      });
    });

    describe('#requestPermissionApproval', () => {
      it('requests permissions for the origin from the ApprovalController', async () => {
        jest
          .spyOn(
            metamaskController.approvalController,
            'addAndShowApprovalRequest',
          )
          .mockResolvedValue();

        await metamaskController.requestPermissionApproval('test.com', {
          eth_accounts: {},
        });

        expect(
          metamaskController.approvalController.addAndShowApprovalRequest,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            id: expect.stringMatching(/.{21}/u),
            origin: 'test.com',
            requestData: {
              metadata: {
                id: expect.stringMatching(/.{21}/u),
                origin: 'test.com',
              },
              permissions: {
                eth_accounts: {},
              },
            },
            type: 'wallet_requestPermissions',
          }),
        );

        const [params] =
          metamaskController.approvalController.addAndShowApprovalRequest.mock
            .calls[0];
        expect(params.id).toStrictEqual(params.requestData.metadata.id);
      });

      it('returns the result from the ApprovalController', async () => {
        jest
          .spyOn(
            metamaskController.approvalController,
            'addAndShowApprovalRequest',
          )
          .mockResolvedValue('approvalResult');

        const result = await metamaskController.requestPermissionApproval(
          'test.com',
          {
            eth_accounts: {},
          },
        );

        expect(result).toStrictEqual('approvalResult');
      });
    });

    describe('requestApprovalPermittedChainsPermission', () => {
      it('requests approval', async () => {
        jest
          .spyOn(
            metamaskController.permissionController,
            'requestPermissionsIncremental',
          )
          .mockResolvedValue();

        await metamaskController.requestApprovalPermittedChainsPermission(
          'test.com',
          '0x1',
        );

        expect(
          metamaskController.permissionController.requestPermissionsIncremental,
        ).toHaveBeenCalledWith(
          { origin: 'test.com' },
          {
            [Caip25EndowmentPermissionName]: {
              caveats: [
                {
                  type: Caip25CaveatType,
                  value: {
                    requiredScopes: {},
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [],
                      },
                    },
                    sessionProperties: {},
                    isMultichainOrigin: false,
                  },
                },
              ],
            },
          },
        );
      });

      it('throws if the approval is rejected', async () => {
        jest
          .spyOn(
            metamaskController.permissionController,
            'requestPermissionsIncremental',
          )
          .mockRejectedValue(new Error('approval rejected'));

        await expect(() =>
          metamaskController.requestApprovalPermittedChainsPermission(
            'test.com',
            '0x1',
          ),
        ).rejects.toThrow(new Error('approval rejected'));
      });
    });

    describe('#sortEvmAccountsByLastSelected', () => {
      it('returns the keyring accounts in lastSelected order', () => {
        jest
          .spyOn(metamaskController.accountsController, 'listAccounts')
          .mockReturnValueOnce([
            {
              address: '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
              id: '21066553-d8c8-4cdc-af33-efc921cd3ca9',
              metadata: {
                name: 'Test Account',
                lastSelected: 1,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            {
              address: '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
              id: '0bd7348e-bdfe-4f67-875c-de831a583857',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            {
              address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
              id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
              metadata: {
                name: 'Test Account',
                keyring: {
                  type: 'HD Key Tree',
                },
                lastSelected: 3,
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
            {
              address: '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
              id: '0bd7348e-bdfe-4f67-875c-de831a583857',
              metadata: {
                name: 'Test Account',
                lastSelected: 3,
                keyring: {
                  type: 'HD Key Tree',
                },
              },
              options: {},
              methods: ETH_EOA_METHODS,
              type: EthAccountType.Eoa,
            },
          ]);
        jest
          .spyOn(metamaskController, 'captureKeyringTypesWithMissingIdentities')
          .mockImplementation(() => {
            // noop
          });

        expect(
          metamaskController.sortEvmAccountsByLastSelected([
            '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
            '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
            '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
          ]),
        ).toStrictEqual([
          '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
          '0x04eBa9B766477d8eCA77F5f0e67AE1863C95a7E3',
          '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
          '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
        ]);
      });

      it('throws if a keyring account is missing an address (case 1)', () => {
        const internalAccounts = [
          {
            address: '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
            id: '0bd7348e-bdfe-4f67-875c-de831a583857',
            metadata: {
              name: 'Test Account',
              lastSelected: 2,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
          {
            address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
            metadata: {
              name: 'Test Account',
              lastSelected: 3,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        ];
        jest
          .spyOn(metamaskController.accountsController, 'listAccounts')
          .mockReturnValueOnce(internalAccounts);
        jest
          .spyOn(metamaskController, 'captureKeyringTypesWithMissingIdentities')
          .mockImplementation(() => {
            // noop
          });

        expect(() =>
          metamaskController.sortEvmAccountsByLastSelected([
            '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
            '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
            '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
          ]),
        ).toThrow(
          'Missing identity for address: "0x7A2Bd22810088523516737b4Dc238A4bC37c23F2".',
        );
        expect(
          metamaskController.captureKeyringTypesWithMissingIdentities,
        ).toHaveBeenCalledWith(internalAccounts, [
          '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
          '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
          '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
        ]);
      });

      it('throws if a keyring account is missing an address (case 2)', () => {
        const internalAccounts = [
          {
            address: '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              name: 'Test Account',
              lastSelected: 1,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
          {
            address: '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
            id: 'ff8fda69-d416-4d25-80a2-efb77bc7d4ad',
            metadata: {
              name: 'Test Account',
              lastSelected: 3,
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: ETH_EOA_METHODS,
            type: EthAccountType.Eoa,
          },
        ];
        jest
          .spyOn(metamaskController.accountsController, 'listAccounts')
          .mockReturnValueOnce(internalAccounts);
        jest
          .spyOn(metamaskController, 'captureKeyringTypesWithMissingIdentities')
          .mockImplementation(() => {
            // noop
          });

        expect(() =>
          metamaskController.sortEvmAccountsByLastSelected([
            '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
            '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
            '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
          ]),
        ).toThrow(
          'Missing identity for address: "0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3".',
        );
        expect(
          metamaskController.captureKeyringTypesWithMissingIdentities,
        ).toHaveBeenCalledWith(internalAccounts, [
          '0x7A2Bd22810088523516737b4Dc238A4bC37c23F2',
          '0x7152f909e5EB3EF198f17e5Cb087c5Ced88294e3',
          '0xDe70d2FF1995DC03EF1a3b584e3ae14da020C616',
        ]);
      });
    });

    describe('NetworkConfiguration is removed', () => {
      it('should remove the permitted chain from all existing permissions', () => {
        jest
          .spyOn(metamaskController, 'removeAllScopePermissions')
          .mockReturnValue();

        metamaskController.controllerMessenger.publish(
          'NetworkController:networkRemoved',
          {
            chainId: '0xa',
          },
        );

        expect(
          metamaskController.removeAllScopePermissions,
        ).toHaveBeenCalledWith('eip155:10');
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
            'MetamaskController:#withKeyringForDevice - Unknown device',
          );
        });

        it('should add the Trezor Hardware keyring and return the first page of accounts', async () => {
          const firstPage = await metamaskController.connectHardware(
            HardwareDeviceNames.trezor,
            0,
          );

          expect(
            metamaskController.keyringController.state.keyrings[1].type,
          ).toBe(TrezorKeyring.type);
          expect(firstPage).toStrictEqual(KNOWN_PUBLIC_KEY_ADDRESSES);
        });

        it('should add the Ledger Hardware keyring and return the first page of accounts', async () => {
          const firstPage = await metamaskController.connectHardware(
            HardwareDeviceNames.ledger,
            0,
          );

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
            'MetamaskController:#withKeyringForDevice - Unknown device',
          );
        });

        [HardwareDeviceNames.trezor, HardwareDeviceNames.ledger].forEach(
          (device) => {
            describe(`using ${device}`, () => {
              it('should be unlocked by default', async () => {
                await metamaskController.connectHardware(device, 0);

                const status =
                  await metamaskController.checkHardwareStatus(device);

                expect(status).toStrictEqual(true);
              });
            });
          },
        );
      });

      describe('getHardwareTypeForMetric', () => {
        it.each(['ledger', 'lattice', 'trezor', 'oneKey', 'qr'])(
          'should return the correct type for %s',
          async (type) => {
            jest
              .spyOn(metamaskController.keyringController, 'withKeyring')
              .mockImplementation((_, fn) => fn({ keyring: { type } }));

            const result =
              await metamaskController.getHardwareTypeForMetric('0x123');

            expect(result).toBe(HardwareKeyringType[type]);
          },
        );
      });

      describe('forgetDevice', () => {
        it('should throw if it receives an unknown device name', async () => {
          const result = metamaskController.forgetDevice(
            'Some random device name',
          );
          await expect(result).rejects.toThrow(
            'MetamaskController:#withKeyringForDevice - Unknown device',
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
      it('throws an error if the keyring controller is locked', async () => {
        const addNewAccount = metamaskController.addNewAccount();
        await expect(addNewAccount).rejects.toThrow(
          'KeyringController - The operation cannot be completed while the controller is locked.',
        );
      });

      it('returns an existing account if the accountCount is less than the number of accounts in the keyring', async () => {
        await metamaskController.createNewVaultAndKeychain('password');
        const secondAccount = await metamaskController.addNewAccount(1);
        await metamaskController.addNewAccount(2);
        await metamaskController.addNewAccount(3);

        const numberOfAccount =
          metamaskController.keyringController.state.keyrings[0].accounts
            .length;
        expect(numberOfAccount).toStrictEqual(4);

        const result = await metamaskController.addNewAccount(1);
        expect(result).toStrictEqual(secondAccount);
      });

      it('only checks for accounts in the keyring when comparing accountCount', async () => {
        await metamaskController.createNewVaultAndKeychain('password');
        // add a new hd keyring vault to simulate having multiple accounts from different keyrings
        await metamaskController.generateNewMnemonicAndAddToVault();

        const numberOfAccounts = (
          await metamaskController.keyringController.getAccounts()
        ).length;
        expect(numberOfAccounts).toStrictEqual(2);

        await metamaskController.addNewAccount(1);

        const numberOfAccountsForPrimaryKeyring =
          metamaskController.keyringController.state.keyrings[0].accounts
            .length;
        const updatedNumberOfAccounts = (
          await metamaskController.keyringController.getAccounts()
        ).length;
        expect(numberOfAccountsForPrimaryKeyring).toStrictEqual(2);
        expect(updatedNumberOfAccounts).toStrictEqual(3);
      });
    });

    describe('#getSeedPhrase', () => {
      it('throws error if keyring controller is locked', async () => {
        await expect(metamaskController.getSeedPhrase()).rejects.toThrow(
          'KeyringController - The operation cannot be completed while the controller is locked.',
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
        ).toHaveBeenCalledWith({
          address: selectedAddressMock,
          chainId: CHAIN_IDS.MAINNET,
        });
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

        const { promise, resolve } = withResolvers();
        const { promise: promiseStream, resolve: resolveStream } =
          withResolvers();
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
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

        const { promise, resolve } = withResolvers();
        const { promise: promiseStream, resolve: resolveStream } =
          withResolvers();
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

        const { promise, resolve } = withResolvers();
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

        const { resolve } = withResolvers();
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
        streamTest.end();
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
          method: 'eth_chainId',
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
        streamTest.end();
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
          jsonrpc: '2.0',
          method: 'eth_chainId',
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
        streamTest.end();
      });

      it('should only process `metamask-provider` multiplex formatted messages', async () => {
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
          jsonrpc: '2.0',
          method: 'eth_chainId',
        };
        await new Promise((resolve) => {
          streamTest.write(
            {
              type: 'caip-348',
              data: {
                method: 'wallet_invokeMethod',
                params: {
                  scope: 'eip155:1',
                  request: message,
                },
              },
            },
            null,
            () => {
              setTimeout(() => {
                expect(loggerMiddlewareMock.requests).toHaveLength(0);
                resolve();
              });
            },
          );
        });
        await new Promise((resolve) => {
          streamTest.write(
            {
              name: 'metamask-provider',
              data: message,
            },
            null,
            () => {
              setTimeout(() => {
                expect(loggerMiddlewareMock.requests).toHaveLength(1);
                resolve();
              });
            },
          );
        });
        streamTest.end();
      });
    });

    describe('#setupUntrustedCommunicationCaip', () => {
      let localMetamaskController;
      beforeEach(() => {
        localMetamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            PreferencesController: {
              useExternalServices: false,
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
        });
        initializeMockMiddlewareLog();
        jest
          .spyOn(localMetamaskController.onboardingController, 'state', 'get')
          .mockReturnValue({ completedOnboarding: true });
      });

      afterAll(() => {
        tearDownMockMiddlewareLog();
      });

      it('adds a tabId and origin to requests', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
          tab: { id: 456 },
        };
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk && chunk.method) {
            cb(null, chunk);
            return;
          }
          cb();
        });

        localMetamaskController.setupUntrustedCommunicationCaip({
          connectionStream: streamTest,
          sender: messageSender,
        });

        const message = {
          jsonrpc: '2.0',
          method: 'eth_chainId',
        };
        await new Promise((resolve) => {
          streamTest.write(
            {
              method: 'wallet_invokeMethod',
              params: {
                scope: 'eip155:1',
                request: message,
              },
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
                resolve();
              });
            },
          );
        });
        streamTest.end();
      });

      it('should add only origin to request if tabId not provided', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
        };
        const streamTest = createThroughStream((chunk, _, cb) => {
          if (chunk && chunk.method) {
            cb(null, chunk);
            return;
          }
          cb();
        });

        localMetamaskController.setupUntrustedCommunicationCaip({
          connectionStream: streamTest,
          sender: messageSender,
        });

        const message = {
          jsonrpc: '2.0',
          method: 'eth_chainId',
        };
        await new Promise((resolve) => {
          streamTest.write(
            {
              method: 'wallet_invokeMethod',
              params: {
                scope: 'eip155:1',
                request: message,
              },
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
        streamTest.end();
      });
    });

    describe('#setupTrustedCommunication', () => {
      it('sets up controller JSON-RPC api for trusted communication', async () => {
        const messageSender = {
          url: 'http://mycrypto.com',
          tab: {},
        };
        const { promise, resolve } = withResolvers();
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
        } = withResolvers();
        const { promise: onStreamEndPromise, resolve: onStreamEndResolve } =
          withResolvers();
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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0x6b175474e89094c44da98b954eedeac495271d0f': tokenData,
                },
              },
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
          networkId: '0x1',
          chainId: '0x1',
        });

        const tokenData = {
          decimals: 18,
          symbol: 'DAI',
        };

        await metamaskController.tokensController.addTokens(
          [
            {
              address: '0x6b175474e89094c44da98b954eedeac495271d0f',
              ...tokenData,
            },
          ],
          'networkConfigurationId1',
        );

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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0x6b175474e89094c44da98b954eedeac495271d0f': tokenData,
                },
              },
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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0xaaa75474e89094c44da98b954eedeac495271d0f': tokenData,
                },
              },
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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0xaaa75474e89094c44da98b954eedeac495271d0f': tokenData,
                },
              },
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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0x6b175474e89094c44da98b954eedeac495271d0f': tokenData,
                },
              },
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

        const tokenSymbol =
          await metamaskController.getTokenSymbol('0xNotInTokenList');

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
            tokensChainsCache: {
              '0x5': {
                data: {
                  '0x6b175474e89094c44da98b954eedeac495271d0f': {},
                },
              },
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

        const tokenSymbol =
          await metamaskController.getTokenSymbol('0xNotInTokenList');

        expect(tokenSymbol).toStrictEqual(null);
      });
    });

    describe('MultichainRatesController start/stop', () => {
      const mockEvmAccount = createMockInternalAccount();
      const mockNonEvmAccount = {
        ...mockEvmAccount,
        scopes: [BtcScope.Mainnet],
        id: '21690786-6abd-45d8-a9f0-9ff1d8ca76a1',
        type: BtcAccountType.P2wpkh,
        methods: [BtcMethod.SendBitcoin],
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      };
      const mockCurrency = 'CAD';

      beforeEach(() => {
        jest.spyOn(metamaskController.multichainRatesController, 'start');
        jest.spyOn(metamaskController.multichainRatesController, 'stop');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      describe('client is open', () => {
        beforeEach(() => {
          jest.replaceProperty(
            metamaskController,
            'activeControllerConnections',
            1,
          );
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
      });

      describe('client is closed', () => {
        beforeEach(() => {
          jest.replaceProperty(
            metamaskController,
            'activeControllerConnections',
            0,
          );
        });

        it('does not start MultichainRatesController if selected account is changed to non-EVM', async () => {
          expect(
            metamaskController.multichainRatesController.start,
          ).not.toHaveBeenCalled();

          metamaskController.controllerMessenger.publish(
            'AccountsController:selectedAccountChange',
            mockNonEvmAccount,
          );

          expect(
            metamaskController.multichainRatesController.start,
          ).not.toHaveBeenCalled();
        });

        it('stops MultichainRatesController if selected account is changed to EVM', async () => {
          metamaskController.controllerMessenger.publish(
            'AccountsController:selectedAccountChange',
            mockEvmAccount,
          );

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
      });

      it('calls setFiatCurrency when the `currentCurrency` has changed', async () => {
        jest.spyOn(RatesController.prototype, 'setFiatCurrency');
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
        });

        metamaskController.controllerMessenger.publish(
          'CurrencyRateController:stateChange',
          { currentCurrency: mockCurrency },
          getMockPatches(),
        );

        expect(
          localMetamaskController.multichainRatesController.setFiatCurrency,
        ).toHaveBeenCalledWith(mockCurrency);
      });
    });

    describe('RemoteFeatureFlagController', () => {
      let localMetamaskController;

      beforeEach(() => {
        localMetamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            PreferencesController: {
              useExternalServices: false,
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
        });

        // Mock the MultichainAccountService action that gets called during preferences changes
        localMetamaskController.controllerMessenger.registerActionHandler(
          'MultichainAccountService:setBasicFunctionality',
          jest.fn().mockResolvedValue(undefined),
        );
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      async function simulateLocalPreferencesChange(preferences) {
        localMetamaskController.controllerMessenger.publish(
          'PreferencesController:stateChange',
          preferences,
          getMockPatches(),
        );
      }

      it('should initialize RemoteFeatureFlagController in disabled state when useExternalServices is false', async () => {
        const { remoteFeatureFlagController, preferencesController } =
          localMetamaskController;

        expect(preferencesController.state.useExternalServices).toBe(false);
        expect(remoteFeatureFlagController.state).toStrictEqual({
          remoteFeatureFlags: {},
          cacheTimestamp: 0,
        });
      });

      it('should disable feature flag fetching when useExternalServices is disabled', async () => {
        const { remoteFeatureFlagController } = localMetamaskController;

        // First enable external services
        await simulateLocalPreferencesChange({
          useExternalServices: true,
        });

        // Then disable them
        await simulateLocalPreferencesChange({
          useExternalServices: false,
        });

        expect(remoteFeatureFlagController.state).toStrictEqual({
          remoteFeatureFlags: {},
          cacheTimestamp: 0,
        });
      });

      it('should handle errors during feature flag updates', async () => {
        const { remoteFeatureFlagController } = localMetamaskController;
        const mockError = new Error('Failed to fetch');

        jest
          .spyOn(remoteFeatureFlagController, 'updateRemoteFeatureFlags')
          .mockRejectedValue(mockError);

        await simulateLocalPreferencesChange({
          useExternalServices: true,
        });

        expect(remoteFeatureFlagController.state).toStrictEqual({
          remoteFeatureFlags: {},
          cacheTimestamp: 0,
        });
      });

      it('should maintain feature flag state across preference toggles', async () => {
        const { remoteFeatureFlagController } = localMetamaskController;
        const mockFlags = { testFlag: true };

        jest
          .spyOn(remoteFeatureFlagController, 'updateRemoteFeatureFlags')
          .mockResolvedValue(mockFlags);

        // Enable external services
        await simulateLocalPreferencesChange({
          useExternalServices: true,
        });

        // Disable external services
        await simulateLocalPreferencesChange({
          useExternalServices: false,
        });

        // Verify state is cleared
        expect(remoteFeatureFlagController.state).toStrictEqual({
          remoteFeatureFlags: {},
          cacheTimestamp: 0,
        });
      });
    });

    describe('_getConfigForRemoteFeatureFlagRequest', () => {
      it('returns config in mapping', async () => {
        const result =
          await metamaskController._getConfigForRemoteFeatureFlagRequest();
        expect(result).toStrictEqual({
          distribution: 'main',
          environment: 'dev',
        });
      });

      it('returna config when not matching default mapping', async () => {
        process.env.METAMASK_BUILD_TYPE = 'non-existent-distribution';
        process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.RELEASE_CANDIDATE;

        const result =
          await metamaskController._getConfigForRemoteFeatureFlagRequest();
        expect(result).toStrictEqual({
          distribution: 'main',
          environment: 'rc',
        });
      });
    });

    describe('generateNewMnemonicAndAddToVault', () => {
      it('generates a new hd keyring instance', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);

        const previousKeyrings =
          metamaskController.keyringController.state.keyrings;

        await metamaskController.generateNewMnemonicAndAddToVault();

        const currentKeyrings =
          metamaskController.keyringController.state.keyrings;

        expect(
          currentKeyrings.filter((kr) => kr.type === 'HD Key Tree'),
        ).toHaveLength(2);
        expect(currentKeyrings).toHaveLength(previousKeyrings.length + 1);
      });
    });

    describe('importMnemonicToVault', () => {
      it('generates a new hd keyring instance with a mnemonic', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');
        const mockSnapKeyring = {
          createAccount: jest
            .fn()
            .mockResolvedValue({ address: 'mockedAddress' }),
        };

        const originalGetKeyringsByType =
          metamaskController.keyringController.getKeyringsByType;
        let snapKeyringCallCount = 0;
        jest
          .spyOn(metamaskController.keyringController, 'getKeyringsByType')
          .mockImplementation((type) => {
            if (type === 'Snap Keyring') {
              snapKeyringCallCount += 1;

              if (snapKeyringCallCount === 1) {
                // First call - use original implementation to let controller initialize snap keyring
                return originalGetKeyringsByType.call(
                  metamaskController.keyringController,
                  type,
                );
              }
              // Second call and beyond - return mock
              console.log('returning mocked snap keyring!');
              return [mockSnapKeyring];
            }

            // For other types, always use original implementation
            return originalGetKeyringsByType.call(
              metamaskController.keyringController,
              type,
            );
          });

        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);

        const previousKeyrings =
          metamaskController.keyringController.state.keyrings;

        await metamaskController.importMnemonicToVault(TEST_SEED_ALT);

        const currentKeyrings =
          metamaskController.keyringController.state.keyrings;

        const newlyAddedKeyringId =
          metamaskController.keyringController.state.keyrings[
            metamaskController.keyringController.state.keyrings.length - 2 // -1 for the snap keyring, -1 for the newly added keyring
          ].metadata.id;

        const newSRP = Buffer.from(
          await metamaskController.getSeedPhrase(password, newlyAddedKeyringId),
        ).toString('utf8');

        expect(
          currentKeyrings.filter((kr) => kr.type === 'HD Key Tree'),
        ).toHaveLength(2);
        expect(
          currentKeyrings.filter((kr) => kr.type === 'Snap Keyring'),
        ).toHaveLength(1);
        expect(currentKeyrings).toHaveLength(previousKeyrings.length + 2);
        expect(newSRP).toStrictEqual(TEST_SEED_ALT);
      });

      it('throws an error if a duplicate srp is added', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
        await expect(() =>
          metamaskController.importMnemonicToVault(TEST_SEED),
        ).rejects.toThrow(
          'This Secret Recovery Phrase has already been imported.',
        );
      });

      it('discovers and creates Solana accounts through KeyringInternalSnapClient when importing a mnemonic', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        const mockDiscoverAccounts = jest
          .fn()
          .mockResolvedValueOnce([]) // Nothing discovered for Bitcoin
          .mockResolvedValueOnce([{ derivationPath: "m/44'/501'/0'/0'" }])
          .mockResolvedValueOnce([{ derivationPath: "m/44'/501'/1'/0'" }])
          .mockResolvedValueOnce([]); // Return empty array on third call to stop the discovery loop

        jest
          .spyOn(KeyringInternalSnapClient.prototype, 'discoverAccounts')
          .mockImplementation(mockDiscoverAccounts);

        const mockCreateAccount = jest.fn().mockResolvedValue(undefined);
        jest
          .spyOn(metamaskController, 'getSnapKeyring')
          .mockResolvedValue({ createAccount: mockCreateAccount });

        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
        await metamaskController.importMnemonicToVault(TEST_SEED_ALT);

        // Assert that discoverAccounts was called correctly:
        // - 1 time for Bitcoin
        // - 3 times for Solana (twice with discovered accounts, once with empty array)
        expect(mockDiscoverAccounts).toHaveBeenCalledTimes(1 + 3);

        // All calls should include the solana scopes
        expect(mockDiscoverAccounts.mock.calls[1][0]).toStrictEqual([
          SolScope.Mainnet,
        ]);

        // First call should be for index 0
        expect(mockDiscoverAccounts.mock.calls[1][2]).toBe(0);
        // Second call should be for index 1
        expect(mockDiscoverAccounts.mock.calls[2][2]).toBe(1);
        // Third call should be for index 2
        expect(mockDiscoverAccounts.mock.calls[3][2]).toBe(2);

        // Assert that createAccount was called correctly for each discovered account:
        // - 1 Bitcoin default account
        // - 2 discovered Solana accounts
        expect(mockCreateAccount).toHaveBeenCalledTimes(1 + 2);

        // All calls should use the solana snap ID
        expect(mockCreateAccount.mock.calls[1][0]).toStrictEqual(
          expect.stringContaining('solana-wallet'),
        );
        // First call should use derivation path on index 0
        expect(mockCreateAccount.mock.calls[1][1]).toStrictEqual({
          accountNameSuggestion: expect.stringContaining('Solana Account'),
          derivationPath: "m/44'/501'/0'/0'",
          entropySource: expect.any(String),
          scope: SolScope.Mainnet,
          synchronize: true,
        });
        // All calls should use the same internal options
        expect(mockCreateAccount.mock.calls[1][2]).toStrictEqual({
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        });

        // Second call should use derivation path on index 1
        expect(mockCreateAccount.mock.calls[2][1]).toStrictEqual({
          accountNameSuggestion: expect.stringContaining('Solana Account'),
          derivationPath: "m/44'/501'/1'/0'",
          entropySource: expect.any(String),
          scope: SolScope.Mainnet,
          synchronize: true,
        });
      });

      it('discovers and creates Bitcoin accounts through KeyringInternalSnapClient when importing a mnemonic', async () => {
        const password = 'what-what-what';
        jest.spyOn(metamaskController, 'getBalance').mockResolvedValue('0x0');

        const mockDiscoverAccounts = jest
          .fn()
          .mockResolvedValueOnce([
            { derivationPath: "m/84'/0'/0'" },
            { derivationPath: "m/86'/0'/0'" },
          ])
          .mockResolvedValueOnce([{ derivationPath: "m/84'/0'/1'" }])
          .mockResolvedValueOnce([]) // Return empty array on third call to stop the discovery loop
          .mockResolvedValueOnce([]); // Nothing discovered for Solana

        jest
          .spyOn(KeyringInternalSnapClient.prototype, 'discoverAccounts')
          .mockImplementation(mockDiscoverAccounts);

        const mockCreateAccount = jest.fn().mockResolvedValue(undefined);
        jest
          .spyOn(metamaskController, 'getSnapKeyring')
          .mockResolvedValue({ createAccount: mockCreateAccount });

        await metamaskController.createNewVaultAndRestore(password, TEST_SEED);
        await metamaskController.importMnemonicToVault(TEST_SEED_ALT);

        // Assert that discoverAccounts was called correctly:
        // - 3 times for Bitcoin (twice with discovered accounts, once with empty array)
        // - 1 time for Solana
        expect(mockDiscoverAccounts).toHaveBeenCalledTimes(3 + 1);

        // All calls should include the solana scopes
        expect(mockDiscoverAccounts.mock.calls[0][0]).toStrictEqual([
          BtcScope.Mainnet,
        ]);

        // First call should be for index 0
        expect(mockDiscoverAccounts.mock.calls[0][2]).toBe(0);
        // Second call should be for index 1
        expect(mockDiscoverAccounts.mock.calls[1][2]).toBe(1);
        // Third call should be for index 2
        expect(mockDiscoverAccounts.mock.calls[2][2]).toBe(2);

        // Assert that createAccount was called correctly for each discovered account:
        // - 3 discovered Bitcoin accounts
        // - 1 Solana default account
        expect(mockCreateAccount).toHaveBeenCalledTimes(3 + 1);

        // All calls should use the bitcoin snap ID
        expect(mockCreateAccount.mock.calls[0][0]).toStrictEqual(
          expect.stringContaining('bitcoin-wallet'),
        );
        // First call should use derivation path on index 0
        expect(mockCreateAccount.mock.calls[0][1]).toStrictEqual({
          accountNameSuggestion: expect.stringContaining('Bitcoin Account'),
          derivationPath: "m/84'/0'/0'",
          entropySource: expect.any(String),
          scope: BtcScope.Mainnet,
          synchronize: true,
        });
        // Second call should use derivation path on index 0 and Taproot account
        expect(mockCreateAccount.mock.calls[1][1]).toStrictEqual({
          accountNameSuggestion: expect.stringContaining('Bitcoin Account'),
          derivationPath: "m/86'/0'/0'",
          entropySource: expect.any(String),
          scope: BtcScope.Mainnet,
          synchronize: true,
        });
        // Third call should use derivation path on index 1
        expect(mockCreateAccount.mock.calls[2][1]).toStrictEqual({
          accountNameSuggestion: expect.stringContaining('Bitcoin Account'),
          derivationPath: "m/84'/0'/1'",
          entropySource: expect.any(String),
          scope: BtcScope.Mainnet,
          synchronize: true,
        });
        // All calls should use the same internal options
        expect(mockCreateAccount.mock.calls[0][2]).toStrictEqual({
          displayConfirmation: false,
          displayAccountNameSuggestion: false,
          setSelectedAccount: false,
        });
      });
    });

    describe('NetworkController state', () => {
      it('fixes selectedNetworkClientId from network controller state if it is invalid', () => {
        metamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState: {
            ...cloneDeep(firstTimeState),
            NetworkController: {
              ...cloneDeep(firstTimeState.NetworkController),
              selectedNetworkClientId: 'invalid-client-id',
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
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
        });

        expect(
          metamaskController.networkController.state.selectedNetworkClientId,
        ).toBe(
          metamaskController.networkController.state
            .networkConfigurationsByChainId[CHAIN_IDS.MAINNET].rpcEndpoints[0]
            .networkClientId,
        );
      });

      it('ensures initial network state networks contain failover RPCs', () => {
        jest
          .spyOn(NetworkConstantsModule, 'getFailoverUrlsForInfuraNetwork')
          .mockReturnValue(['https://mock_rpc']);

        const initState = cloneDeep(firstTimeState);
        delete initState.NetworkController;
        metamaskController = new MetaMaskController({
          showUserConfirmation: noop,
          encryptor: mockEncryptor,
          initState,
          initLangCode: 'en_US',
          platform: {
            showTransactionNotification: () => undefined,
            getVersion: () => 'foo',
          },
          browser: browserPolyfillMock,
          infuraProjectId: 'foo',
          isFirstMetaMaskControllerSetup: true,
          cronjobControllerStorageManager:
            createMockCronjobControllerStorageManager(),
        });

        const networkState = metamaskController.networkController.state;
        const networksWithFailoverUrls = [
          CHAIN_IDS.MAINNET,
          CHAIN_IDS.LINEA_MAINNET,
          CHAIN_IDS.BASE,
        ];
        const networksWithoutFailoverUrls = [
          CHAIN_IDS.SEPOLIA,
          CHAIN_IDS.LINEA_SEPOLIA,
          CHAIN_IDS.MEGAETH_TESTNET,
          '0x279f', // Monad Testnet
          '0x539', // Localhost
        ];

        // Assert - ensure networks with failovers have failovers, and other networks do not have failovers
        // NOTE - if a network enabled by default is missing a failover, double check if it needs to be inserted
        Object.keys(networkState.networkConfigurationsByChainId).forEach(
          (
            /** @type {import('@metamask/utils').Hex} */
            chainId,
          ) => {
            // Assert ensure we are checking all known networks
            // NOTE - if network is missing, append it to either with failover or wthout failovers
            expect([
              ...networksWithFailoverUrls,
              ...networksWithoutFailoverUrls,
            ]).toContain(chainId);
          },
        );

        // Assert - networks have failovers
        networksWithFailoverUrls.forEach((chainId) => {
          expect(
            networkState.networkConfigurationsByChainId[chainId].rpcEndpoints[0]
              .failoverUrls,
          ).toHaveLength(1);
        });

        // Assert - networks without failovers
        networksWithoutFailoverUrls.forEach((chainId) => {
          expect(
            networkState.networkConfigurationsByChainId[chainId].rpcEndpoints[0]
              .failoverUrls,
          ).toHaveLength(0);
        });
      });
    });

    describe('#syncSeedPhrases', () => {
      beforeEach(async () => {
        // Unlock the keyring controller first
        await metamaskController.createNewVaultAndKeychain('test-password');

        jest.spyOn(
          metamaskController.onboardingController,
          'getIsSocialLoginFlow',
        );
        jest.spyOn(
          metamaskController.seedlessOnboardingController,
          'fetchAllSecretData',
        );
        jest.spyOn(
          metamaskController.seedlessOnboardingController,
          'getSecretDataBackupState',
        );
        jest.spyOn(metamaskController, 'importMnemonicToVault');
        jest.spyOn(
          metamaskController,
          '_convertEnglishWordlistIndicesToCodepoints',
        );
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should throw error if not in social login flow', async () => {
        metamaskController.onboardingController.getIsSocialLoginFlow.mockReturnValue(
          false,
        );

        await expect(metamaskController.syncSeedPhrases()).rejects.toThrow(
          'Syncing seed phrases is only available for social login flow',
        );
      });

      it('should throw error if no root SRP found', async () => {
        metamaskController.onboardingController.getIsSocialLoginFlow.mockReturnValue(
          true,
        );
        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [], // Empty array means no root SRP
        );

        await expect(metamaskController.syncSeedPhrases()).rejects.toThrow(
          'No root SRP found',
        );
      });

      it('should import new seed phrases that are not in local state', async () => {
        const mockRootSRP = new Uint8Array([1, 2, 3, 4]);
        const mockOtherSRP1 = new Uint8Array([5, 6, 7, 8]);
        const mockOtherSRP2 = new Uint8Array([9, 10, 11, 12]);
        const mockMnemonic =
          'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';

        metamaskController.onboardingController.getIsSocialLoginFlow.mockReturnValue(
          true,
        );
        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockRootSRP, mockOtherSRP1, mockOtherSRP2].map((srp) => ({
            data: srp,
            type: 'mnemonic',
          })),
        );

        // First SRP exists in local state, second doesn't
        metamaskController.seedlessOnboardingController.getSecretDataBackupState
          .mockReturnValueOnce({
            hash: 'existing-hash',
            type: 'mnemonic',
          }) // First SRP exists
          .mockReturnValueOnce(null); // Second SRP doesn't exist

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValueOnce(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        await metamaskController.syncSeedPhrases();

        // Should only import the second SRP (the one that doesn't exist locally)
        expect(metamaskController.importMnemonicToVault).toHaveBeenCalledTimes(
          1,
        );
        expect(metamaskController.importMnemonicToVault).toHaveBeenCalledWith(
          mockMnemonic,
          {
            shouldCreateSocialBackup: false,
            shouldSelectAccount: false,
            shouldImportSolanaAccount: true,
          },
        );
      });

      it('should not import seed phrases that already exist in local state', async () => {
        const mockRootSRP = new Uint8Array([1, 2, 3, 4]);
        const mockOtherSRP = new Uint8Array([5, 6, 7, 8]);

        metamaskController.onboardingController.getIsSocialLoginFlow.mockReturnValue(
          true,
        );
        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockRootSRP, mockOtherSRP].map((srp) => ({
            data: srp,
            type: 'mnemonic',
          })),
        );

        // Both SRPs exist in local state
        metamaskController.seedlessOnboardingController.getSecretDataBackupState.mockReturnValue(
          {
            hash: 'existing-hash',
            type: 'mnemonic',
          },
        );

        await metamaskController.syncSeedPhrases();

        // Should not import any SRPs since they all exist locally
        expect(metamaskController.importMnemonicToVault).not.toHaveBeenCalled();
      });

      it('should handle multiple seed phrases that need to be imported', async () => {
        const mockRootSRP = new Uint8Array([1, 2, 3, 4]);
        const mockOtherSRP1 = new Uint8Array([5, 6, 7, 8]);
        const mockOtherSRP2 = new Uint8Array([9, 10, 11, 12]);
        const mockMnemonic1 =
          'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
        const mockMnemonic2 =
          'setup olympic issue mobile velvet surge alcohol burger horse view reopen gentle';

        metamaskController.onboardingController.getIsSocialLoginFlow.mockReturnValue(
          true,
        );
        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockRootSRP, mockOtherSRP1, mockOtherSRP2].map((srp) => ({
            data: srp,
            type: 'mnemonic',
          })),
        );

        // Both other SRPs don't exist in local state
        metamaskController.seedlessOnboardingController.getSecretDataBackupState
          .mockReturnValueOnce(null) // First other SRP doesn't exist
          .mockReturnValueOnce(null); // Second other SRP doesn't exist

        function isEqualUint8Array(arr1, arr2) {
          if (arr1.length !== arr2.length) {
            return false;
          }

          return arr1.every((value, index) => value === arr2[index]);
        }

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockImplementation(
          (wordlistIndices) => {
            if (isEqualUint8Array(wordlistIndices, mockOtherSRP1)) {
              return Buffer.from(mockMnemonic1, 'utf8');
            } else if (isEqualUint8Array(wordlistIndices, mockOtherSRP2)) {
              return Buffer.from(mockMnemonic2, 'utf8');
            }

            return new Uint8Array(0);
          },
        );

        await metamaskController.syncSeedPhrases();

        // Should import both SRPs that don't exist locally
        expect(metamaskController.importMnemonicToVault).toHaveBeenCalledTimes(
          2,
        );
        expect(
          metamaskController.importMnemonicToVault,
        ).toHaveBeenNthCalledWith(1, mockMnemonic1, {
          shouldCreateSocialBackup: false,
          shouldSelectAccount: false,
          shouldImportSolanaAccount: true,
        });
      });
    });

    describe('#restoreSocialBackupAndGetSeedPhrase', () => {
      const mockPassword = 'test-password';
      const mockMnemonic =
        'debris dizzy just program just float decrease vacant alarm reduce speak stadium';
      const mockEncodedMnemonic = new Uint8Array([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
      const mockEncodedSeedPhrase = Array.from(
        Buffer.from(mockMnemonic, 'utf8').values(),
      );

      beforeEach(async () => {
        // Unlock the keyring controller first
        await metamaskController.createNewVaultAndKeychain('test-password');

        jest.spyOn(
          metamaskController.seedlessOnboardingController,
          'fetchAllSecretData',
        );
        jest.spyOn(
          metamaskController,
          '_convertEnglishWordlistIndicesToCodepoints',
        );
        jest.spyOn(metamaskController, 'createNewVaultAndRestore');
        jest.spyOn(metamaskController, 'restoreSeedPhrasesToVault');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should successfully restore social backup and return seed phrase', async () => {
        const mockFirstSecretData = {
          data: mockEncodedMnemonic,
          type: 'mnemonic',
          timestamp: Date.now(),
          version: 1,
        };
        const mockRemainingSecretData = [
          {
            data: new Uint8Array([11, 12, 13, 14]),
            type: 'mnemonic',
            timestamp: Date.now(),
            version: 1,
          },
        ];

        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockFirstSecretData, ...mockRemainingSecretData],
        );

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValue(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        const result =
          await metamaskController.restoreSocialBackupAndGetSeedPhrase(
            mockPassword,
          );

        expect(
          metamaskController.seedlessOnboardingController.fetchAllSecretData,
        ).toHaveBeenCalledWith(mockPassword);
        expect(
          metamaskController._convertEnglishWordlistIndicesToCodepoints,
        ).toHaveBeenCalledWith(mockEncodedMnemonic);
        expect(
          metamaskController.createNewVaultAndRestore,
        ).toHaveBeenCalledWith(mockPassword, mockEncodedSeedPhrase);
        expect(
          metamaskController.restoreSeedPhrasesToVault,
        ).toHaveBeenCalledWith(mockRemainingSecretData);
        expect(result).toBe(mockMnemonic);
      });

      it('should handle case when no remaining secret data exists', async () => {
        const mockFirstSecretData = {
          data: mockEncodedMnemonic,
          type: 'mnemonic',
          timestamp: Date.now(),
          version: 1,
        };

        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockFirstSecretData],
        );

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValue(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        const result =
          await metamaskController.restoreSocialBackupAndGetSeedPhrase(
            mockPassword,
          );

        expect(
          metamaskController.createNewVaultAndRestore,
        ).toHaveBeenCalledWith(mockPassword, mockEncodedSeedPhrase);
        expect(
          metamaskController.restoreSeedPhrasesToVault,
        ).not.toHaveBeenCalled();
        expect(result).toBe(mockMnemonic);
      });

      it('should handle multiple remaining secret data items', async () => {
        const mockFirstSecretData = {
          data: mockEncodedMnemonic,
          type: 'mnemonic',
          timestamp: Date.now(),
          version: 1,
        };
        const mockRemainingSecretData = [
          {
            data: new Uint8Array([11, 12, 13, 14]),
            type: 'mnemonic',
            timestamp: Date.now(),
            version: 1,
          },
          {
            data: new Uint8Array([15, 16, 17, 18]),
            type: 'privateKey',
            timestamp: Date.now(),
            version: 1,
          },
          {
            data: new Uint8Array([19, 20, 21, 22]),
            type: 'mnemonic',
            timestamp: Date.now(),
            version: 1,
          },
        ];

        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockFirstSecretData, ...mockRemainingSecretData],
        );

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValue(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        const result =
          await metamaskController.restoreSocialBackupAndGetSeedPhrase(
            mockPassword,
          );

        expect(
          metamaskController.restoreSeedPhrasesToVault,
        ).toHaveBeenCalledWith(mockRemainingSecretData);
        expect(result).toBe(mockMnemonic);
      });

      it('should handle errors from fetchAllSecretData', async () => {
        const mockError = new Error('Failed to fetch secret data');
        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockRejectedValue(
          mockError,
        );

        await expect(
          metamaskController.restoreSocialBackupAndGetSeedPhrase(mockPassword),
        ).rejects.toThrow('Failed to fetch secret data');
      });

      it('should handle errors from createNewVaultAndRestore', async () => {
        const mockFirstSecretData = {
          data: mockEncodedMnemonic,
          type: 'mnemonic',
          timestamp: Date.now(),
          version: 1,
        };

        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockFirstSecretData],
        );

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValue(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        const mockError = new Error('Failed to create vault');
        metamaskController.createNewVaultAndRestore.mockRejectedValue(
          mockError,
        );

        await expect(
          metamaskController.restoreSocialBackupAndGetSeedPhrase(mockPassword),
        ).rejects.toThrow('Failed to create vault');
      });

      it('should handle errors from restoreSeedPhrasesToVault', async () => {
        const mockFirstSecretData = {
          data: mockEncodedMnemonic,
          type: 'mnemonic',
          timestamp: Date.now(),
          version: 1,
        };
        const mockRemainingSecretData = [
          {
            data: new Uint8Array([11, 12, 13, 14]),
            type: 'mnemonic',
            timestamp: Date.now(),
            version: 1,
          },
        ];

        metamaskController.seedlessOnboardingController.fetchAllSecretData.mockResolvedValue(
          [mockFirstSecretData, ...mockRemainingSecretData],
        );

        metamaskController._convertEnglishWordlistIndicesToCodepoints.mockReturnValue(
          Buffer.from(mockMnemonic, 'utf8'),
        );

        const mockError = new Error('Failed to restore seed phrases');
        metamaskController.restoreSeedPhrasesToVault.mockRejectedValue(
          mockError,
        );

        await expect(
          metamaskController.restoreSocialBackupAndGetSeedPhrase(mockPassword),
        ).rejects.toThrow('Failed to restore seed phrases');
      });
    });
  });

  describe('onFeatureFlagResponseReceived', () => {
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
      cronjobControllerStorageManager:
        createMockCronjobControllerStorageManager(),
    });

    beforeEach(() => {
      jest.spyOn(
        metamaskController.tokenBalancesController,
        'setIntervalLength',
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not set the interval length if the pollInterval is 0', () => {
      metamaskController.onFeatureFlagResponseReceived({
        multiChainAssets: {
          pollInterval: 0,
        },
      });
      expect(
        metamaskController.tokenBalancesController.setIntervalLength,
      ).not.toHaveBeenCalled();
    });

    it('should set the interval length if the pollInterval is greater than 0', () => {
      const pollInterval = 10;
      metamaskController.onFeatureFlagResponseReceived({
        multiChainAssets: {
          pollInterval,
        },
      });
      expect(
        metamaskController.tokenBalancesController.setIntervalLength,
      ).toHaveBeenCalledWith(pollInterval * SECOND);
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
        cronjobControllerStorageManager:
          createMockCronjobControllerStorageManager(),
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
        cronjobControllerStorageManager:
          createMockCronjobControllerStorageManager(),
      });

      expect(metamaskController.resetStates).not.toHaveBeenCalled();
      expect(browserPolyfillMock.storage.session.set).not.toHaveBeenCalled();
    });
  });
});
