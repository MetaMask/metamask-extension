import MMIController from './mmi-controller';
import { KeyringController } from '@metamask/eth-keyring-controller';
import { MmiConfigurationController } from '@metamask-institutional/custody-keyring';
import { TransactionUpdateController } from '@metamask-institutional/transaction-update';

import TransactionController from './controllers/transactions';
import PreferencesController from './controllers/preferences';
import AppStateController from './controllers/app-state';

describe('MMIController', () => {
  let mmiController;

  beforeEach(() => {
    // create a new instance of MMIController before each test
    mmiController = new MMIController({
      // provide required options for the constructor
      mmiConfigurationController: new MmiConfigurationController(),
      keyringController: new KeyringController({
        initState: {}
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
      }),
      preferencesController: new PreferencesController({
        initState: {},
        onInfuraIsBlocked: jest.fn(),
        onInfuraIsUnblocked: jest.fn(),
        provider: {},
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
        messenger: {
          call: jest.fn(() => ({
            catch: jest.fn(),
          })),
        },
      })

    });
  });

  describe('constructor', () => {
    test('should instantiate correctly', () => {
      expect(mmiController).toBeInstanceOf(MMIController);
    });

    test('should have all required properties', () => {
      expect(mmiController.opts).toBeDefined();
      expect(mmiController.mmiConfigurationController).toBeDefined();
      expect(mmiController.preferencesController).toBeDefined();
      expect(mmiController.transactionUpdateController).toBeDefined();
    });
  });

  describe('persistKeyringsAfterRefreshTokenChange', () => {
    test('should call keyringController.persistAllKeyrings', async () => {
      mmiController.keyringController.persistAllKeyrings = jest.fn();

      await mmiController.persistKeyringsAfterRefreshTokenChange();

      expect(mmiController.keyringController.persistAllKeyrings).toHaveBeenCalled();
    });
  });

  describe('trackTransactionEventFromCustodianEvent', () => {
    test('should call txController._trackTransactionMetricsEvent', () => {
      const txMeta = {};
      const event = 'event';
      mmiController.txController._trackTransactionMetricsEvent = jest.fn();

      mmiController.trackTransactionEventFromCustodianEvent(txMeta, event);

      expect(mmiController.txController._trackTransactionMetricsEvent).toHaveBeenCalledWith(txMeta, event);
    });
  });

});

