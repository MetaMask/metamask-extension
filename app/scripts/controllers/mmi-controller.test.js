/* eslint-disable */
import { KeyringController } from '@metamask/keyring-controller';
import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { SignatureController } from '@metamask/signature-controller';
import { NetworkController } from '@metamask/network-controller';
import { AccountsController } from '@metamask/accounts-controller';

import MMIController from './mmi-controller';
import TransactionController from './transactions';
import PreferencesController from './preferences';
import AppStateController from './app-state';
import { ControllerMessenger } from '@metamask/base-controller';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';

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
  let mmiController;
  let controllerMessenger;
  let accountsController;
  let networkController;

  beforeEach(function () {
    const mockMessenger = {
      call: jest.fn(() => ({
        catch: jest.fn(),
      })),
      registerActionHandler: jest.fn(),
      publish: jest.fn(),
    };

    mmiController = new MMIController({
      mmiConfigurationController: new MmiConfigurationController(),
      keyringController: new KeyringController({
        messenger: mockMessenger,
        initState: {},
      }),
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
        getNetworkId: jest.fn(),
        onNetworkStateChange: jest.fn(),
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
        onInfuraIsBlocked: jest.fn(),
        onInfuraIsUnblocked: jest.fn(),
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
        qrHardwareStore: {
          subscribe: jest.fn(),
        },
        messenger: mockMessenger,
      }),
      custodianEventHandlerFactory: jest.fn(),
      accountsController,
      controllerMessenger,
      networkController,
      metaMetricsController: mockMetaMetrics,
      extension: mockExtension,
    });
  });

  describe('mmiController constructor', function () {
    it('should instantiate correctly', function () {
      expect(mmiController).toBeInstanceOf(MMIController);
    });

    it('should have all required properties', function () {
      expect(mmiController.opts).toBeDefined();
      expect(mmiController.mmiConfigurationController).toBeDefined();
      expect(mmiController.transactionUpdateController).toBeDefined();
      expect(mmiController.accountsController).toBeDefined();
      expect(mmiController.controllerMessenger).toBeDefined();
    });
  });

  describe('persistKeyringsAfterRefreshTokenChange', function () {
    it('should call keyringController.persistAllKeyrings', async function () {
      mmiController.keyringController.persistAllKeyrings = jest.fn();

      await mmiController.persistKeyringsAfterRefreshTokenChange();

      expect(
        mmiController.keyringController.persistAllKeyrings,
      ).toHaveBeenCalled();
    });
  });

  describe('trackTransactionEventFromCustodianEvent', function () {
    it('should call txController._trackTransactionMetricsEvent', function () {
      const txMeta = {};
      const event = 'event';
      mmiController.txController._trackTransactionMetricsEvent = jest.fn();

      mmiController.trackTransactionEventFromCustodianEvent(txMeta, event);

      expect(
        mmiController.txController._trackTransactionMetricsEvent,
      ).toHaveBeenCalledWith(txMeta, event);
    });
  });

  describe('custodianEventHandlerFactory', function () {
    it('should call custodianEventHandlerFactory', async function () {
      mmiController.custodianEventHandlerFactory = jest.fn();

      mmiController.custodianEventHandlerFactory();

      expect(mmiController.custodianEventHandlerFactory).toHaveBeenCalled();
    });
  });

  describe('storeCustodianSupportedChains', function () {
    it('should call storeCustodianSupportedChains', async function () {
      mmiController.storeCustodianSupportedChains = jest.fn();

      mmiController.storeCustodianSupportedChains('0x1');

      expect(mmiController.storeCustodianSupportedChains).toHaveBeenCalledWith(
        '0x1',
      );
    });
  });

  describe('AccountsController:stateChange event', function () {
    it('should call prepareMmiPortfolio', async () => {
      mmiController.txController._trackTransactionMetricsEvent = jest.fn();
      jest.spyOn(mmiController, 'prepareMmiPortfolio');
      await controllerMessenger.publish('AccountsController:stateChange', []);

      expect(mmiController.prepareMmiPortfolio).toHaveBeenCalled();
    });
  });

  describe('setAccountAndNetwork', function () {
    it('should set a new selected account if the selectedAddress and the address from the arguments is different', async () => {
      mmiController.txController._trackTransactionMetricsEvent = jest.fn();
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
