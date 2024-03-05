/* eslint-disable */
import { KeyringController } from '@metamask/keyring-controller';
import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';
import { SignatureController } from '@metamask/signature-controller';

import MMIController from './mmi-controller';
import PreferencesController from './preferences';
import { TransactionStatus } from '@metamask/transaction-controller';
import AppStateController from './app-state';

describe('MMIController', function () {
  let mmiController: MMIController;
  const createKeyringControllerMock = () => ({
    decryptMessage: jest.fn(),
  });

  const keyringControllerMock = createKeyringControllerMock();
  beforeEach(function () {
    const mockMessenger = {
      call: jest.fn(() => ({
        catch: jest.fn(),
      })),
      registerActionHandler: jest.fn(),
      registerInitialEventPayload: jest.fn(),
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    mmiController = new MMIController({
      mmiConfigurationController: new MmiConfigurationController(),
      keyringController: keyringControllerMock as any,
      transactionUpdateController: new TransactionUpdateController({
        getCustodyKeyring: jest.fn(),
        mmiConfigurationController: new MmiConfigurationController(),
        captureException: jest.fn(),
      }),
      signatureController: new SignatureController({
        messenger: mockMessenger as any,
        isEthSignEnabled: jest.fn(),
        getAllState: jest.fn(),
        securityProviderRequest: jest.fn(),
        getCurrentChainId: jest.fn(),
      }),
      // @ts-expect-error not relevant
      preferencesController: new PreferencesController({
        initState: {},
        onAccountRemoved: jest.fn(),
        provider: {},
        networkConfigurations: {},
        onKeyringStateChange: jest.fn(),
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
      // @ts-expect-error not relevant
      custodianEventHandlerFactory: jest.fn(),
      getTransactions: jest.fn(),
      updateTransactionHash: jest.fn(),
      trackTransactionEvents: jest.fn(),
      setTxStatusSigned: jest.fn(),
      setTxStatusSubmitted: jest.fn(),
      setTxStatusFailed: jest.fn(),
      updateTransaction: jest.fn(),
    });
  });

  describe('mmiController constructor', function () {
    it('should instantiate correctly', function () {
      expect(mmiController).toBeInstanceOf(MMIController);
    });

    it('should have all required properties', function () {
      expect(mmiController.opts).toBeDefined();
      expect(mmiController.mmiConfigurationController).toBeDefined();
      expect(mmiController.preferencesController).toBeDefined();
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

      mmiController.trackTransactionEventFromCustodianEvent(
        {
          chainId: '0x',
          id: '',
          time: 0,
          txParams: {
            from: '',
          },
          status: TransactionStatus.approved,
        },
        event,
      );

      expect(mmiController.trackTransactionEvents).toHaveBeenCalledWith(
        {
          transactionMeta: {
            chainId: '0x',
            id: '',
            status: 'approved',
            time: 0,
            txParams: {
              from: '',
            },
          },
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
});
