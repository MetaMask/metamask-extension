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
import { EthAccountType } from '@metamask/keyring-api';
import { CustodyController } from '@metamask-institutional/custody-controller';
import * as PortfolioDashboard from '@metamask-institutional/portfolio-dashboard';
import {
  CHAIN_IDS,
  NETWORK_TYPES,
  TEST_NETWORK_TICKER_MAP,
} from '../../../shared/constants/network';
import { MMIController, AllowedActions } from './mmi-controller';
import { AppStateController } from './app-state-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { mmiKeyringBuilderFactory } from '../mmi-keyring-builder-factory';
import { ETH_EOA_METHODS } from '../../../shared/constants/eth-methods';
import { mockNetworkState } from '../../../test/stub/networks';
import { InfuraNetworkType } from '@metamask/controller-utils';
import { API_REQUEST_LOG_EVENT } from '@metamask-institutional/sdk';
import { getDefaultPreferencesControllerState } from './preferences-controller';

jest.mock('@metamask-institutional/portfolio-dashboard', () => ({
  handleMmiPortfolio: jest.fn(),
}));

jest.mock('./permissions', () => ({
  ...jest.requireActual('./permissions'),
  getPermissionBackgroundApiMethods: jest.fn().mockImplementation(() => {
    return {
      addPermittedAccount: jest.fn(),
    };
  }),
}));

export const createMockNetworkConfiguration = (
  override?: Partial<NetworkConfiguration>,
): NetworkConfiguration => {
  return {
    chainId: CHAIN_IDS.SEPOLIA,
    blockExplorerUrls: [],
    defaultRpcEndpointIndex: 0,
    name: 'Mock Network',
    nativeCurrency: 'MOCK TOKEN',
    rpcEndpoints: [],
    defaultBlockExplorerUrlIndex: 0,
    ...override,
  };
};

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
  methods: ETH_EOA_METHODS,
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
  methods: ETH_EOA_METHODS,
  type: EthAccountType.Eoa,
};

const mockMetaMetricsId = 'mock-metametrics-id';

describe('MMIController', function () {
  let mmiController,
    mmiConfigurationController,
    controllerMessenger,
    accountsController,
    keyringController,
    custodyController,
    mmiControllerMessenger;

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

    const controllerMessenger = new ControllerMessenger<
      AllowedActions,
      never
    >();

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
            custodyType: 'Custody - ECA3',
          },
          [mockAccount2.address]: {
            custodyType: 'Custody - ECA3',
          },
        },
      },
    });

    controllerMessenger.registerActionHandler(
      'MetaMetricsController:getState',
      () => ({
        metaMetricsId: mockMetaMetricsId,
      }),
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:getState',
      jest
        .fn()
        .mockReturnValue(mockNetworkState({ chainId: CHAIN_IDS.SEPOLIA })),
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:setActiveNetwork',
      InfuraNetworkType['sepolia'],
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:getNetworkClientById',
      jest.fn().mockReturnValue({
        configuration: {
          chainId: CHAIN_IDS.SEPOLIA,
        },
      }),
    );

    controllerMessenger.registerActionHandler(
      'NetworkController:getNetworkConfigurationByChainId',
      jest.fn().mockReturnValue(createMockNetworkConfiguration()),
    );

    mmiControllerMessenger = controllerMessenger.getRestricted({
      name: 'MMIController',
      allowedActions: [
        'AccountsController:getAccountByAddress',
        'AccountsController:setAccountName',
        'AccountsController:listAccounts',
        'AccountsController:getSelectedAccount',
        'AccountsController:setSelectedAccount',
        'MetaMetricsController:getState',
        'NetworkController:getState',
        'NetworkController:setActiveNetwork',
        'NetworkController:getNetworkClientById',
        'NetworkController:getNetworkConfigurationByChainId',
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
      }),
      appStateController: new AppStateController({
        addUnlockListener: jest.fn(),
        isUnlocked: jest.fn(() => true),
        initState: {},
        onInactiveTimeout: jest.fn(),
        showUnlockRequest: jest.fn(),
        messenger: {
          ...mockMessenger,
          call: jest.fn().mockReturnValue({
            preferences: {
              autoLockTimeLimit: 0,
            },
          }),
        },
      }),
      permissionController,
      custodyController,
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

    mmiController.getState = jest.fn();
    mmiController.captureException = jest.fn();
    mmiController.accountTrackerController = { syncWithAddresses: jest.fn() };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addKeyringIfNotExists', () => {
    it('should add a new keyring if it does not exist', async () => {
      const type = 'mock-keyring-type';
      mmiController.keyringController.getKeyringsByType = jest
        .fn()
        .mockReturnValue([]);
      mmiController.keyringController.addNewKeyring = jest
        .fn()
        .mockResolvedValue('new-keyring');

      const result = await mmiController.addKeyringIfNotExists(type);

      expect(
        mmiController.keyringController.getKeyringsByType,
      ).toHaveBeenCalledWith(type);
      expect(
        mmiController.keyringController.addNewKeyring,
      ).toHaveBeenCalledWith(type);
      expect(result).toBe('new-keyring');
    });

    it('should return existing keyring if it exists', async () => {
      const type = 'mock-keyring-type';
      const existingKeyring = 'existing-keyring';
      mmiController.keyringController.getKeyringsByType = jest
        .fn()
        .mockReturnValue([existingKeyring]);
      mmiController.keyringController.addNewKeyring = jest.fn();

      const result = await mmiController.addKeyringIfNotExists(type);

      expect(
        mmiController.keyringController.getKeyringsByType,
      ).toHaveBeenCalledWith(type);
      expect(
        mmiController.keyringController.addNewKeyring,
      ).not.toHaveBeenCalled();
      expect(result).toBe(existingKeyring);
    });
  });

  describe('onSubmitPassword', () => {
    it('should add keyrings and handle refresh tokens and events', async () => {
      mmiController.custodyController.getAllCustodyTypes = jest
        .fn()
        .mockReturnValue(['mock-custody-type']);
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        on: jest.fn(),
        getAccounts: jest.fn().mockResolvedValue(['0x1']),
        getSupportedChains: jest.fn().mockResolvedValue({}),
      });
      mmiController.storeCustodianSupportedChains = jest.fn();
      mmiController.txStateManager = {
        getTransactions: jest.fn().mockReturnValue([]),
      };
      mmiController.transactionUpdateController.subscribeToEvents = jest.fn();
      mmiController.mmiConfigurationController.storeConfiguration = jest.fn();
      mmiController.transactionUpdateController.getCustomerProofForAddresses =
        jest.fn();

      await mmiController.onSubmitPassword();

      expect(mmiController.addKeyringIfNotExists).toHaveBeenCalled();
      expect(mmiController.storeCustodianSupportedChains).toHaveBeenCalled();
      expect(
        mmiController.transactionUpdateController.subscribeToEvents,
      ).toHaveBeenCalled();
      expect(
        mmiController.mmiConfigurationController.storeConfiguration,
      ).toHaveBeenCalled();
    });

    it('should set up API_REQUEST_LOG_EVENT listener on keyring', async () => {
      const mockKeyring = {
        on: jest.fn(),
        getAccounts: jest.fn().mockResolvedValue([]),
        getSupportedChains: jest.fn().mockResolvedValue({}),
      };

      mmiController.addKeyringIfNotExists = jest
        .fn()
        .mockResolvedValue(mockKeyring);
      mmiController.custodyController.getAllCustodyTypes = jest
        .fn()
        .mockReturnValue(['mock-custody-type']);
      mmiController.logAndStoreApiRequest = jest.fn();

      await mmiController.onSubmitPassword();

      expect(mockKeyring.on).toHaveBeenCalledWith(
        API_REQUEST_LOG_EVENT,
        expect.any(Function),
      );

      const mockLogData = { someKey: 'someValue' };
      const apiRequestLogEventHandler = mockKeyring.on.mock.calls.find(
        (call) => call[0] === API_REQUEST_LOG_EVENT,
      )[1];
      apiRequestLogEventHandler(mockLogData);

      expect(mmiController.logAndStoreApiRequest).toHaveBeenCalledWith(
        mockLogData,
      );
    });
  });

  describe('connectCustodyAddresses', () => {
    it('should connect new addresses to custodian', async () => {
      const custodianType = 'mock-custodian-type';
      const custodianName = 'mock-custodian-name';
      const accounts = {
        '0x1': {
          name: 'Account 1',
          custodianDetails: {},
          labels: [],
          token: 'token',
          chainId: 1,
        },
      };
      CUSTODIAN_TYPES['MOCK-CUSTODIAN-TYPE'] = {
        keyringClass: { type: 'mock-keyring-class' },
      };
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        on: jest.fn(),
        setSelectedAddresses: jest.fn(),
        addAccounts: jest.fn(),
        addNewAccountForKeyring: jest.fn(),
        getStatusMap: jest.fn(),
      });
      mmiController.keyringController.getAccounts = jest
        .fn()
        .mockResolvedValue(['0x2']);
      mmiController.keyringController.addNewAccountForKeyring = jest.fn();

      mmiController.custodyController.setAccountDetails = jest.fn();
      mmiController.accountTrackerController.syncWithAddresses = jest.fn();
      mmiController.storeCustodianSupportedChains = jest.fn();
      mmiController.custodyController.storeCustodyStatusMap = jest.fn();

      const result = await mmiController.connectCustodyAddresses(
        custodianType,
        custodianName,
        accounts,
      );

      expect(mmiController.addKeyringIfNotExists).toHaveBeenCalled();
      expect(mmiController.keyringController.getAccounts).toHaveBeenCalled();
      expect(
        mmiController.custodyController.setAccountDetails,
      ).toHaveBeenCalled();
      expect(
        mmiController.accountTrackerController.syncWithAddresses,
      ).toHaveBeenCalled();
      expect(mmiController.storeCustodianSupportedChains).toHaveBeenCalled();
      expect(
        mmiController.custodyController.storeCustodyStatusMap,
      ).toHaveBeenCalled();
      expect(result).toEqual(['0x1']);
    });

    it('should set up API_REQUEST_LOG_EVENT listener on keyring', async () => {
      const custodianType = 'mock-custodian-type';
      const custodianName = 'mock-custodian-name';
      const accounts = {
        '0x1': {
          name: 'Account 1',
          custodianDetails: {},
          labels: [],
          token: 'token',
          chainId: 1,
        },
      };
      CUSTODIAN_TYPES['MOCK-CUSTODIAN-TYPE'] = {
        keyringClass: { type: 'mock-keyring-class' },
      };

      const mockKeyring = {
        on: jest.fn(),
        setSelectedAddresses: jest.fn(),
        addAccounts: jest.fn(),
        getStatusMap: jest.fn(),
      };

      mmiController.addKeyringIfNotExists = jest
        .fn()
        .mockResolvedValue(mockKeyring);
      mmiController.keyringController.getAccounts = jest
        .fn()
        .mockResolvedValue(['0x2']);
      mmiController.keyringController.addNewAccountForKeyring = jest
        .fn()
        .mockResolvedValue('0x3');
      mmiController.custodyController.setAccountDetails = jest.fn();
      mmiController.accountTrackerController.syncWithAddresses = jest.fn();
      mmiController.storeCustodianSupportedChains = jest.fn();
      mmiController.custodyController.storeCustodyStatusMap = jest.fn();
      mmiController.logAndStoreApiRequest = jest.fn();

      await mmiController.connectCustodyAddresses(
        custodianType,
        custodianName,
        accounts,
      );

      expect(mockKeyring.on).toHaveBeenCalledWith(
        API_REQUEST_LOG_EVENT,
        expect.any(Function),
      );

      const mockLogData = { someKey: 'someValue' };
      const apiRequestLogEventHandler = mockKeyring.on.mock.calls.find(
        (call) => call[0] === API_REQUEST_LOG_EVENT,
      )[1];
      apiRequestLogEventHandler(mockLogData);

      expect(mmiController.logAndStoreApiRequest).toHaveBeenCalledWith(
        mockLogData,
      );
    });
  });

  describe('getCustodianAccounts', () => {
    it('should return custodian accounts', async () => {
      CUSTODIAN_TYPES['MOCK-CUSTODIAN-TYPE'] = {
        keyringClass: { type: 'mock-keyring-class' },
      };
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        getCustodianAccounts: jest.fn().mockResolvedValue(['account1']),
      });

      const result = await mmiController.getCustodianAccounts(
        'token',
        'neptune-custody',
        'ECA3',
        true,
      );

      expect(result).toEqual(['account1']);
    });

    it('should return custodian accounts when custodianType is not provided', async () => {
      CUSTODIAN_TYPES['CUSTODIAN-TYPE'] = {
        keyringClass: { type: 'mock-keyring-class' },
      };
      jest
        .spyOn(mmiControllerMessenger, 'call')
        .mockReturnValue({ address: '0x1' });
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodian-type');
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        getCustodianAccounts: jest.fn().mockResolvedValue(['account1']),
      });

      const result = await mmiController.getCustodianAccounts(
        'token',
        'neptune-custody',
      );

      expect(result).toEqual(['account1']);
    });
  });

  describe('getCustodianTransactionDeepLink', () => {
    it('should return a transaction deep link', async () => {
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodyType');
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        getTransactionDeepLink: jest
          .fn()
          .mockResolvedValue('transactionDeepLink'),
      });

      const result = await mmiController.getCustodianTransactionDeepLink(
        'address',
        'txId',
      );

      expect(result).toEqual('transactionDeepLink');
    });
  });

  describe('getCustodianConfirmDeepLink', () => {
    it('should return a confirmation deep link', async () => {
      mmiController.txStateManager = {
        getTransactions: jest.fn().mockReturnValue([
          {
            id: 'txId',
            txParams: { from: '0x1' },
            custodyId: 'custodyId',
          },
        ]),
      };
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodyType');
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        getTransactionDeepLink: jest
          .fn()
          .mockResolvedValue('transactionDeepLink'),
      });

      const result = await mmiController.getCustodianConfirmDeepLink('txId');

      expect(result).toEqual({
        deepLink: 'transactionDeepLink',
        custodyId: 'custodyId',
      });
    });
  });

  describe('getCustodianSignMessageDeepLink', () => {
    it('should return a sign message deep link', async () => {
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodyType');
      mmiController.addKeyringIfNotExists = jest.fn().mockResolvedValue({
        getTransactionDeepLink: jest
          .fn()
          .mockResolvedValue('transactionDeepLink'),
      });

      const result = await mmiController.getCustodianSignMessageDeepLink(
        'address',
        'custodyTxId',
      );

      expect(result).toEqual('transactionDeepLink');
    });
  });

  describe('getCustodianToken', () => {
    it('should return a custodian token', async () => {
      mmiController.keyringController.getKeyringForAccount = jest
        .fn()
        .mockResolvedValue({
          getAccountDetails: jest.fn().mockReturnValue({
            authDetails: { jwt: 'jwtToken' },
          }),
        });

      const result = await mmiController.getCustodianToken('address');

      expect(result).toEqual('jwtToken');
    });

    it('should return an empty string if authDetails are undefined', async () => {
      mmiController.keyringController.getKeyringForAccount = jest
        .fn()
        .mockResolvedValue({
          getAccountDetails: jest.fn().mockReturnValue({}),
        });

      const result = await mmiController.getCustodianToken('address');

      expect(result).toEqual('');
    });
  });

  describe('getCustodianJWTList', () => {
    it('should return a list of JWTs for a custodian', async () => {
      mmiController.custodyController.getAccountDetails = jest
        .fn()
        .mockReturnValue({});
      jest
        .spyOn(mmiControllerMessenger, 'call')
        .mockReturnValue([mockAccount, mockAccount2]);
      mmiController.mmiConfigurationController.store.getState = jest
        .fn()
        .mockReturnValue({
          mmiConfiguration: {
            custodians: [{ envName: 'custodianEnvName', type: 'ECA3' }],
          },
        });
      mmiController.keyringController.getKeyringsByType = jest
        .fn()
        .mockReturnValue([
          {
            getAccountDetails: jest.fn().mockReturnValue({
              authDetails: { jwt: 'jwtToken' },
            }),
          },
        ]);

      const result = await mmiController.getCustodianJWTList(
        'custodianEnvName',
      );

      expect(result).toEqual([]);
    });
  });

  describe('getAllCustodianAccountsWithToken', () => {
    it('should return all custodian accounts with a token', async () => {
      mmiController.keyringController.getKeyringsByType = jest
        .fn()
        .mockReturnValue([
          {
            getAllAccountsWithToken: jest.fn().mockReturnValue(['account1']),
          },
        ]);

      const result = await mmiController.getAllCustodianAccountsWithToken(
        'custodyType',
        'token',
      );

      expect(result).toEqual(['account1']);
    });
  });

  describe('setCustodianNewRefreshToken', () => {
    it('should set a new refresh token for a custodian account', async () => {
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodyType');
      const keyringMock = {
        replaceRefreshTokenAuthDetails: jest.fn(),
      };
      mmiController.addKeyringIfNotExists = jest
        .fn()
        .mockResolvedValue(keyringMock);

      await mmiController.setCustodianNewRefreshToken({
        address: 'address',
        refreshToken: 'refreshToken',
      });

      expect(keyringMock.replaceRefreshTokenAuthDetails).toHaveBeenCalledWith(
        'address',
        'refreshToken',
      );
    });
  });

  describe('handleMmiCheckIfTokenIsPresent', () => {
    it('should check if a token is present', async () => {
      mmiController.messagingSystem.call = jest
        .fn()
        .mockReturnValue({ address: '0x1' });
      mmiController.custodyController.getCustodyTypeByAddress = jest
        .fn()
        .mockReturnValue('custodyType');
      mmiController.addKeyringIfNotExists = jest
        .fn()
        .mockResolvedValue('keyring');
      mmiController.appStateController.getUnlockPromise = jest.fn();
      mmiController.custodyController.handleMmiCheckIfTokenIsPresent =
        jest.fn();

      await mmiController.handleMmiCheckIfTokenIsPresent({
        params: {
          token: 'token',
          envName: 'envName',
          address: 'address',
        },
      });

      expect(
        mmiController.appStateController.getUnlockPromise,
      ).toHaveBeenCalled();
      expect(
        mmiController.custodyController.handleMmiCheckIfTokenIsPresent,
      ).toHaveBeenCalled();
    });
  });

  describe('handleMmiDashboardData', () => {
    it('should return internalAccounts as identities', async () => {
      const controllerMessengerSpy = jest.spyOn(mmiControllerMessenger, 'call');
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

  describe('newUnsignedMessage', () => {
    it('should create a new unsigned message', async () => {
      mmiController.custodyController.getAccountDetails = jest
        .fn()
        .mockReturnValue({});

      const message = { from: '0x1' };
      const request = { method: 'eth_signTypedData' };

      mmiController.signatureController.newUnsignedTypedMessage = jest
        .fn()
        .mockResolvedValue('unsignedTypedMessage');

      const result = await mmiController.newUnsignedMessage(
        message,
        request,
        'v4',
      );

      expect(result).toEqual('unsignedTypedMessage');
    });
  });

  describe('handleSigningEvents', () => {
    it('should handle signing events', async () => {
      mmiController.transactionUpdateController.addTransactionToWatchList = jest
        .fn()
        .mockResolvedValue('added');
      mmiController.signatureController.setMessageMetadata = jest.fn();

      const signature = {
        custodian_transactionId: 'custodianTxId',
        from: '0x1',
      };
      const messageId = 'messageId';

      await mmiController.handleSigningEvents(
        signature,
        messageId,
        'signOperation',
      );

      expect(
        mmiController.transactionUpdateController.addTransactionToWatchList,
      ).toHaveBeenCalledWith('custodianTxId', '0x1', 'signOperation', true);
      expect(
        mmiController.signatureController.setMessageMetadata,
      ).toHaveBeenCalledWith(messageId, signature);
    });
  });

  describe('setAccountAndNetwork', () => {
    it('should set a new selected account if the selectedAddress and the address from the arguments is different', async () => {
      const selectedAccountSpy = jest.spyOn(mmiControllerMessenger, 'call');
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
      const selectedAccountSpy = jest.spyOn(mmiControllerMessenger, 'call');
      await mmiController.setAccountAndNetwork(
        'mock-origin',
        mockAccount.address,
        '0x1',
      );

      expect(selectedAccountSpy).toHaveBeenCalledTimes(4);
      const selectedAccount = accountsController.getSelectedAccount();
      expect(selectedAccount.id).toBe(mockAccount.id);
    });
  });

  describe('handleMmiOpenAddHardwareWallet', () => {
    it('should open add hardware wallet interface', async () => {
      mmiController.appStateController.getUnlockPromise = jest.fn();
      mmiController.platform = { openExtensionInBrowser: jest.fn() };

      await mmiController.handleMmiOpenAddHardwareWallet();

      expect(
        mmiController.appStateController.getUnlockPromise,
      ).toHaveBeenCalled();
      expect(
        mmiController.platform.openExtensionInBrowser,
      ).toHaveBeenCalledWith('/new-account/connect');
    });
  });

  describe('logAndStoreApiRequest', () => {
    it('should call custodyController.sanitizeAndLogApiCall with the provided log data', async () => {
      const mockLogData = { someKey: 'someValue' };
      const mockSanitizedLogs = { sanitizedKey: 'sanitizedValue' };

      mmiController.custodyController.sanitizeAndLogApiCall = jest
        .fn()
        .mockResolvedValue(mockSanitizedLogs);

      const result = await mmiController.logAndStoreApiRequest(mockLogData);

      expect(
        mmiController.custodyController.sanitizeAndLogApiCall,
      ).toHaveBeenCalledWith(mockLogData);
      expect(result).toEqual(mockSanitizedLogs);
    });

    it('should handle errors and throw them', async () => {
      const mockLogData = { someKey: 'someValue' };
      const mockError = new Error('Sanitize error');

      mmiController.custodyController.sanitizeAndLogApiCall = jest
        .fn()
        .mockRejectedValue(mockError);

      await expect(
        mmiController.logAndStoreApiRequest(mockLogData),
      ).rejects.toThrow('Sanitize error');
    });
  });
});
