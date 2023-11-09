/* eslint-disable */
import { KeyringController } from '@metamask/keyring-controller';
import {
  CUSTODIAN_TYPES,
  MmiConfigurationController,
} from '@metamask-institutional/custody-keyring';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { SignatureController } from '@metamask/signature-controller';
import { NetworkController } from '@metamask/network-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
import * as portfolioDashboard from '@metamask-institutional/portfolio-dashboard';

import { CustodyController } from '@metamask-institutional/custody-controller';
import { mmiKeyringBuilderFactory } from '../mmi-keyring-builder-factory';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
} from '../../../shared/constants/network';
import MMIController from './mmi-controller';
import TransactionController from './transactions';
import PreferencesController from './preferences';
import AppStateController from './app-state';

jest.mock('./permissions', () => ({
  getPermissionBackgroundApiMethods: () => ({
    addPermittedAccount: jest.fn().mockReturnValue(),
  }),
}));

const mockMetaMetrics = {
  store: {
    getState: jest.fn().mockReturnValue({ metaMetricsId: 'mock-metrics-id' }),
  },
};
const mockExtension = {
  runtime: {
    id: 'mock-runtime-id',
  },
};

const mockAccount = {
  address: '0x1',
  id: 'mock-id',
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [...Object.values(EthMethod)],
  type: EthAccountType.Eoa,
};
const mockAccount2 = {
  address: '0x2',
  id: 'mock-id-2',
  metadata: {
    name: 'Test Account 2',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [...Object.values(EthMethod)],
  type: EthAccountType.Eoa,
};

describe('MMIController', function () {
  let mmiController,
    mmiConfigurationController,
    controllerMessenger,
    accountsController,
    networkController,
    keyringController,
    custodyController;
  let handleMmiPortfolioSpy, controllerMessengerSpy;

  beforeEach(async function () {
    const mockMessenger = {
      call: jest.fn(() => ({
        catch: jest.fn(),
      })),
      registerActionHandler: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    networkController = new NetworkController({
      messenger: new ControllerMessenger().getRestricted({
        name: 'NetworkController',
        allowedEvents: [
          'NetworkController:stateChange',
          'NetworkController:networkWillChange',
          'NetworkController:networkDidChange',
          'NetworkController:infuraIsBlocked',
          'NetworkController:infuraIsUnblocked',
        ],
      }),
      state: {
        providerConfig: {
          type: NETWORK_TYPES.SEPOLIA,
          chainId: CHAIN_IDS.SEPOLIA,
          ticker: TEST_NETWORK_TICKER_MAP[NETWORK_TYPES.SEPOLIA],
        },
      },
      infuraProjectId: 'mock-infura-project-id',
    });

    controllerMessenger = new ControllerMessenger();

    accountsController = new AccountsController({
      messenger: controllerMessenger.getRestricted({
        name: 'AccountsController',
        allowedEvents: [
          'SnapController:stateChange',
          'KeyringController:accountRemoved',
          'KeyringController:stateChange',
          'KeyringController:persistAllKeyrings',
          'AccountsController:selectedAccountChange',
        ],
        allowedActions: [
          'AccountsController:setCurrentAccount',
          'AccountsController:setAccountName',
          'AccountsController:listAccounts',
          'AccountsController:updateAccounts',
          'KeyringController:getAccounts',
          'KeyringController:getKeyringsByType',
          'KeyringController:getKeyringForAccount',
        ],
      }),
      state: {
        internalAccounts: {
          accounts: {
            [mockAccount.id]: mockAccount,
            [mockAccount2.id]: mockAccount2,
          },
          selectedAccount: mockAccount.id,
        },
      },
    });

    mmiConfigurationController = new MmiConfigurationController();

    const custodianKeyringBuilders = Object.keys(CUSTODIAN_TYPES).map(
      (custodianType) => {
        return mmiKeyringBuilderFactory(
          CUSTODIAN_TYPES[custodianType].keyringClass,
          { mmiConfigurationController },
        );
      },
    );

    keyringController = new KeyringController({
      messenger: controllerMessenger.getRestricted({
        name: 'KeyringController',
        allowedActions: [
          'KeyringController:getState',
          'KeyringController:signMessage',
          'KeyringController:signPersonalMessage',
          'KeyringController:signTypedMessage',
          'KeyringController:decryptMessage',
          'KeyringController:getEncryptionPublicKey',
          'KeyringController:getKeyringsByType',
          'KeyringController:getKeyringForAccount',
          'KeyringController:getAccounts',
        ],
        allowedEvents: [
          'KeyringController:stateChange',
          'KeyringController:lock',
          'KeyringController:unlock',
          'KeyringController:accountRemoved',
          'KeyringController:qrKeyringStateChange',
        ],
      }),
      keyringBuilders: [...custodianKeyringBuilders],
      state: {},
      encryptor: {
        encrypt(_, object) {
          this.object = object;
          return Promise.resolve('mock-encrypted');
        },
        decrypt() {
          return Promise.resolve(this.object);
        },
      },
      updateIdentities: jest.fn(),
      syncIdentities: jest.fn(),
    });

    custodyController = new CustodyController();

    mmiController = new MMIController({
      mmiConfigurationController,
      keyringController,
      transactionUpdateController: new TransactionUpdateController({
        getCustodyKeyring: jest.fn(),
      }),
      txController: new TransactionController({
        initState: {},
        provider: {
          chainId: 'fail',
          nickname: '',
          rpcTarget: 'https://api.myetherwallet.com/eth',
          ticker: 'ETH',
          type: 'rinkeby',
        },
        getCurrentChainId: jest.fn(),
        onNetworkStateChange: jest.fn(),
        getNetworkId: jest.fn(),
        blockTracker: {
          getLatestBlock: jest.fn().mockResolvedValue({}),
        },
      }),
      signatureController: new SignatureController({
        messenger: mockMessenger,
        keyringController: new KeyringController({
          initState: {},
          messenger: mockMessenger,
        }),
        isEthSignEnabled: jest.fn(),
        getAllState: jest.fn(),
        securityProviderRequest: jest.fn(),
        getCurrentChainId: jest.fn(),
      }),
      preferencesController: new PreferencesController({
        initState: {},
        onAccountRemoved: jest.fn(),
        provider: {},
        networkConfigurations: {},
      }),
      appStateController: new AppStateController({
        addUnlockListener: jest.fn(),
        isUnlocked: jest.fn(() => true),
        initState: {},
        onInactiveTimeout: jest.fn(),
        showUnlockRequest: jest.fn(),
        preferencesStore: {
          subscribe: jest.fn(),
          getState: jest.fn(() => ({
            preferences: {
              autoLockTimeLimit: 0,
            },
          })),
        },
        messenger: mockMessenger,
      }),
      custodianEventHandlerFactory: jest.fn(),
      custodyController,
      controllerMessenger,
      networkController,
      metaMetricsController: mockMetaMetrics,
      extension: mockExtension,
    });

    handleMmiPortfolioSpy = jest.spyOn(
      portfolioDashboard,
      'handleMmiPortfolio',
    );

    controllerMessengerSpy = jest.spyOn(controllerMessenger, 'call');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('mmiController constructor', function () {
    it('should instantiate correctly', function () {
      expect(mmiController).toBeInstanceOf(MMIController);
    });

    it('should have all required properties', function () {
      expect(mmiController.opts).toBeDefined();
      expect(mmiController.mmiConfigurationController).toBeDefined();
      expect(mmiController.transactionUpdateController).toBeDefined();
    });
  });

  describe('persistKeyringsAfterRefreshTokenChange', function () {
    it('should call keyringController.persistAllKeyrings', async function () {
      jest
        .spyOn(mmiController.keyringController, 'persistAllKeyrings')
        .mockImplementation();

      await mmiController.persistKeyringsAfterRefreshTokenChange();

      expect(
        mmiController.keyringController.persistAllKeyrings,
      ).toHaveBeenCalled();
    });
  });

  describe('trackTransactionEventFromCustodianEvent', function () {
    it('should call trackTransactionEvents', function () {
      const event = 'event';
      mmiController.trackTransactionEvents = jest.fn();

      mmiController.trackTransactionEventFromCustodianEvent({}, event);

      expect(mmiController.trackTransactionEvents).toHaveBeenCalledWith(
        {
          transactionMeta: {},
        },
        event,
      );
    });
  });

  describe('custodianEventHandlerFactory', function () {
    it('should call custodianEventHandlerFactory', async function () {
      jest
        .spyOn(mmiController, 'custodianEventHandlerFactory')
        .mockImplementation();

      mmiController.custodianEventHandlerFactory();

      expect(mmiController.custodianEventHandlerFactory).toHaveBeenCalled();
    });
  });

  describe('storeCustodianSupportedChains', function () {
    it('should call storeCustodianSupportedChains', async function () {
      jest
        .spyOn(mmiController, 'storeCustodianSupportedChains')
        .mockImplementation();

      mmiController.storeCustodianSupportedChains('0x1');

      expect(mmiController.storeCustodianSupportedChains).toHaveBeenCalledWith(
        '0x1',
      );
    });
  });
  describe('handleMmiDashboardData', () => {
    it('should return internalAccounts as identities', async () => {
      await mmiController.handleMmiDashboardData();

      expect(controllerMessengerSpy).toHaveBeenCalledWith(
        'AccountsController:listAccounts',
      );
      expect(controllerMessengerSpy).toHaveReturnedWith([
        mockAccount,
        mockAccount2,
      ]);
      expect(handleMmiPortfolioSpy).toHaveBeenCalled();
    });
  });

  describe('getCustodianJWTList', () => {
    it('should call the controller messenger to get internalAccounts', async () => {
      await mmiController.getCustodianJWTList();

      expect(controllerMessengerSpy).toHaveBeenCalledWith(
        'AccountsController:listAccounts',
      );

      expect(controllerMessengerSpy).toHaveReturnedWith([
        mockAccount,
        mockAccount2,
      ]);
    });
  });

  describe('setAccountAndNetwork', function () {
    it('should set a new selected account if the selectedAddress and the address from the arguments is different', async () => {
      await mmiController.setAccountAndNetwork(
        'mock-origin',
        mockAccount2.address,
        '0x1',
      );
      const selectedAccount = accountsController.getSelectedAccount();
      expect(selectedAccount.id).toBe(mockAccount2.id);
    });

    it('should set a new selected account the accounts are the same', async () => {
      await mmiController.setAccountAndNetwork(
        'mock-origin',
        mockAccount.address,
        '0x1',
      );
      const selectedAccount = accountsController.getSelectedAccount();
      expect(selectedAccount.id).toBe(mockAccount.id);
    });
  });
});
