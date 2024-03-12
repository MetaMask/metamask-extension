/* eslint-disable */
// @ts-nocheck
import { KeyringController } from '@metamask/keyring-controller';
import {
  CUSTODIAN_TYPES,
  MmiConfigurationController,
} from '@metamask-institutional/custody-keyring';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { SignatureController } from '@metamask/signature-controller';

import { NetworkController } from '@metamask/network-controller';
import { AccountsController } from '@metamask/accounts-controller';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';

import { CustodyController } from '@metamask-institutional/custody-controller';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
} from '../../../shared/constants/network';

import MMIController from './mmi-controller';
import AppStateController from './app-state';
import { ControllerMessenger } from '@metamask/base-controller';
import { mmiKeyringBuilderFactory } from '../mmi-keyring-builder-factory';
import MetaMetricsController from './metametrics';

jest.mock('@metamask-institutional/portfolio-dashboard', () => ({
  handleMmiPortfolio: jest.fn(),
}));

import * as PortfolioDashboard from '@metamask-institutional/portfolio-dashboard';

jest.mock('./permissions', () => ({
  getPermissionBackgroundApiMethods: jest.fn().mockImplementation(() => {
    return {
      addPermittedAccount: jest.fn(),
    };
  }),
}));

const mockAccount = {
  address: '0x758b8178a9A4B7206d1f648c4a77C515Cbac7001',
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
  address: '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe6',
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

const mockMetaMetricsId = 'mock-metametrics-id';

describe('MMIController', function () {
  let mmiController,
    mmiConfigurationController,
    controllerMessenger,
    accountsController,
    networkController,
    keyringController,
    metaMetricsController,
    custodyController;
  let handleMmiPortfolioSpy, controllerMessengerSpy;

  beforeEach(async function () {
    const mockMessenger = {
      call: jest.fn(() => ({
        catch: jest.fn(),
      })),
      registerActionHandler: jest.fn(),
      registerInitialEventPayload: jest.fn(),
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

    const permissionController = {
      updateCaveat: () => jest.fn(),
      getCaveat: () => jest.fn().mockResolvedValue(),
    };

    custodyController = new CustodyController({
      initState: {
        custodyAccountDetails: {
          [mockAccount.address]: {
            custodyType: 'Custody - Jupiter',
          },
          [mockAccount2.address]: {
            custodyType: 'Custody - Jupiter',
          },
        },
      },
    });

    metaMetricsController = new MetaMetricsController({
      preferencesStore: {
        getState: jest.fn().mockReturnValue({ currentLocale: 'en' }),
        subscribe: jest.fn(),
      },
      getCurrentChainId: jest.fn(),
      onNetworkDidChange: jest.fn(),
    });

    const mmiControllerMessenger = controllerMessenger.getRestricted({
      name: 'MMIController',
      allowedActions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:listAccounts',
        'AccountsController:getSelectedAccount',
        'AccountsController:setSelectedAccount',
      ],
    });

    mmiController = new MMIController({
      messenger: mmiControllerMessenger,
      mmiConfigurationController,
      keyringController,
      transactionUpdateController: new TransactionUpdateController({
        getCustodyKeyring: jest.fn(),
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
      networkController,
      permissionController,
      custodyController,
      metaMetricsController,
      custodianEventHandlerFactory: jest.fn(),
      getTransactions: jest.fn(),
      updateTransactionHash: jest.fn(),
      trackTransactionEvents: jest.fn(),
      setTxStatusSigned: jest.fn(),
      setTxStatusSubmitted: jest.fn(),
      setTxStatusFailed: jest.fn(),
      updateTransaction: jest.fn(),
      extension: { runtime: { id: 'mock-extension-id' } },
    });

    jest.spyOn(metaMetricsController.store, 'getState').mockReturnValue({
      metaMetricsId: mockMetaMetricsId,
    });
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
      mmiController.keyringController.persistAllKeyrings = jest.fn();

      await mmiController.persistKeyringsAfterRefreshTokenChange();

      expect(
        mmiController.keyringController.persistAllKeyrings,
      ).toHaveBeenCalled();
    });
  });

  describe('trackTransactionEventFromCustodianEvent', function () {
    it('should call trackTransactionEvents', function () {
      const event = 'event';

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

  describe('getAllCustodianAccountsWithToken', () => {
    it('should return custodian accounts with tokens', async () => {});
  });

  describe('handleMmiDashboardData', () => {
    it('should return internalAccounts as identities', async () => {
      const controllerMessengerSpy = jest.spyOn(controllerMessenger, 'call');
      await mmiController.handleMmiDashboardData();

      expect(controllerMessengerSpy).toHaveBeenCalledWith(
        'AccountsController:listAccounts',
      );
      expect(controllerMessengerSpy).toHaveReturnedWith([
        mockAccount,
        mockAccount2,
      ]);
      expect(PortfolioDashboard.handleMmiPortfolio).toBeCalledWith(
        expect.objectContaining({
          keyringAccounts: expect.anything(),
          identities: [mockAccount, mockAccount2].map((account) => {
            return { address: account.address, name: account.metadata.name };
          }),
          metaMetricsId: expect.anything(),
          networks: expect.anything(),
          getAccountDetails: expect.anything(),
          extensionId: expect.anything(),
        }),
      );
    });
  });

  describe('getCustodianJWTList', () => {
    it('should call the controller messenger to get internalAccounts', async () => {
      const controllerMessengerSpy = jest.spyOn(controllerMessenger, 'call');
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
      const selectedAccountSpy = jest.spyOn(controllerMessenger, 'call');
      await mmiController.setAccountAndNetwork(
        'mock-origin',
        mockAccount2.address,
        '0x1',
      );

      expect(selectedAccountSpy).toHaveBeenCalledWith(
        'AccountsController:setSelectedAccount',
        mockAccount2.id,
      );

      const selectedAccount = accountsController.getSelectedAccount();

      expect(selectedAccount.id).toBe(mockAccount2.id);
    });

    it('should not set a new selected account the accounts are the same', async () => {
      const selectedAccountSpy = jest.spyOn(controllerMessenger, 'call');
      await mmiController.setAccountAndNetwork(
        'mock-origin',
        mockAccount.address,
        '0x1',
      );
      // only getSelectedAccount
      expect(selectedAccountSpy).toHaveBeenCalledTimes(1);
      const selectedAccount = accountsController.getSelectedAccount();
      expect(selectedAccount.id).toBe(mockAccount.id);
    });
  });

  describe('getCustodianAccounts', () => {
    const mockCustodialKeyring = jest.fn();
    it('returns custodian accounts', async () => {
      const selectedAccountSpy = jest.spyOn(controllerMessenger, 'call');
      const keyringControllerSpy = jest
        .spyOn(keyringController, 'addNewKeyring')
        .mockReturnValue({
          getCustodianAccounts: mockCustodialKeyring,
        });

      await mmiController.getCustodianAccounts('token', 'mock url', 'JUPITER');

      expect(selectedAccountSpy).toHaveBeenCalledTimes(0);

      expect(keyringControllerSpy).toHaveBeenCalledWith('Custody - Jupiter');
      expect(mockCustodialKeyring).toHaveBeenCalled();
    });

    it("returns custodian accounts when custodyType isn't set", async () => {
      const selectedAccountSpy = jest.spyOn(controllerMessenger, 'call');
      const keyringControllerSpy = jest
        .spyOn(keyringController, 'addNewKeyring')
        .mockReturnValue({
          getCustodianAccounts: mockCustodialKeyring,
        });

      await mmiController.getCustodianAccounts('token', 'mock url');

      expect(selectedAccountSpy).toHaveBeenCalledWith(
        'AccountsController:getSelectedAccount',
      );
      expect(selectedAccountSpy).toHaveReturnedWith(mockAccount);

      expect(keyringControllerSpy).toHaveBeenCalledWith('Custody - Jupiter');
      expect(mockCustodialKeyring).toHaveBeenCalled();
    });
  });
});
