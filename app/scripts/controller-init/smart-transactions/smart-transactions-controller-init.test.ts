import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { Messenger } from '@metamask/base-controller';
import type { AccountsController } from '@metamask/accounts-controller';
import type { TransactionController } from '@metamask/transaction-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import type {
  BaseRestrictedControllerMessenger,
  ControllerInitRequest,
} from '../types';
import {
  getSmartTransactionsControllerInitMessenger,
  SmartTransactionsControllerInitMessenger,
  SmartTransactionsControllerMessenger,
} from '../messengers/smart-transactions-controller-messenger';
import { ControllerFlatState } from '../controller-list';
import type {
  MetaMetricsEventPayload,
  MetaMetricsEventOptions,
} from '../../../../shared/constants/metametrics';
import { SmartTransactionsControllerInit } from './smart-transactions-controller-init';

jest.mock('@metamask/smart-transactions-controller');

// Define mock types for the dependencies
type MockAccountsController = Pick<AccountsController, 'getSelectedAccount'>;
type MockTransactionController = Pick<
  TransactionController,
  | 'getNonceLock'
  | 'confirmExternalTransaction'
  | 'getTransactions'
  | 'updateTransaction'
>;

type TestInitRequest = ControllerInitRequest<
  SmartTransactionsControllerMessenger,
  SmartTransactionsControllerInitMessenger
> & {
  getStateUI: () => { metamask: ControllerFlatState };
  getGlobalNetworkClientId: () => string;
  getAccountType: (address: string) => Promise<string>;
  getDeviceModel: (address: string) => Promise<string>;
  getHardwareTypeForMetric: (address: string) => Promise<string>;
  trace: jest.Mock;
};

describe('SmartTransactionsController Init', () => {
  const smartTransactionsControllerClassMock = jest.mocked(
    SmartTransactionsController,
  );

  /**
   * Build a mock for required dependencies.
   *
   * @returns An object with mocked dependencies
   */
  function buildMockDependencies() {
    const baseControllerMessenger = new Messenger();
    const restrictedMessenger = {
      subscribe: jest.fn(),
      publish: jest.fn(),
      call: jest.fn(),
      registerActionHandler: jest.fn(),
      registerEventHandler: jest.fn(),
      clearEventHandlers: jest.fn(),
      clearActionHandlers: jest.fn(),
    } as unknown as BaseRestrictedControllerMessenger;

    baseControllerMessenger.getRestricted = jest
      .fn()
      .mockReturnValue(restrictedMessenger);

    const accountsController: MockAccountsController = {
      getSelectedAccount: jest.fn().mockReturnValue({ address: '0x123' }),
    };

    const transactionController: MockTransactionController = {
      getNonceLock: jest.fn().mockResolvedValue({ releaseLock: jest.fn() }),
      confirmExternalTransaction: jest.fn(),
      getTransactions: jest.fn().mockReturnValue([]),
      updateTransaction: jest.fn(),
    };

    return {
      baseControllerMessenger,
      restrictedMessenger,
      accountsController,
      transactionController,
    };
  }

  /**
   * Build the init request with custom options.
   *
   * @param options - Custom options to override defaults
   * @returns A complete init request object
   */
  function buildInitRequest(options: Partial<TestInitRequest> = {}) {
    const mocks = buildMockDependencies();
    const requestMock = buildControllerInitRequestMock();

    const fullRequest = {
      ...requestMock,
      baseControllerMessenger: mocks.baseControllerMessenger,
      controllerMessenger:
        mocks.restrictedMessenger as SmartTransactionsControllerMessenger,
      initMessenger: getSmartTransactionsControllerInitMessenger(
        mocks.baseControllerMessenger,
      ),
      getController: jest.fn((name: string) => {
        switch (name) {
          case 'AccountsController':
            return mocks.accountsController;
          case 'TransactionController':
            return mocks.transactionController;
          default:
            return {};
        }
      }),
      persistedState: {
        SmartTransactionsController: {
          smartTransactionsState: {
            smartTransactions: {},
            userOptIn: true,
            userOptInV2: true,
            liveness: true,
            fees: {
              approvalTxFees: null,
              tradeTxFees: null,
            },
            feesByChainId: {},
            livenessByChainId: {},
          },
        },
      },
      getStateUI: jest.fn().mockReturnValue({
        metamask: {
          internalAccounts: {
            selectedAccount: 'account-id',
            accounts: {
              'account-id': {
                id: 'account-id',
                address: '0x123',
                metadata: {
                  name: 'Test Account',
                },
              },
            },
          },
          preferences: {
            smartTransactionsOptInStatus: true,
          },
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [
                {
                  networkClientId: 'mainnet',
                  url: 'https://mainnet.infura.io/v3/abc',
                },
              ],
            },
          },
          featureFlags: {
            smartTransactions: {
              mobileActive: false,
              extensionActive: true,
              extensionReturnTxHashAsap: false,
            },
          },
          swapsState: {
            swapsFeatureFlags: {
              ethereum: {
                extensionActive: true,
                mobileActive: false,
                smartTransactions: {
                  expectedDeadline: 45,
                  maxDeadline: 150,
                  extensionReturnTxHashAsap: false,
                },
              },
              smartTransactions: {
                mobileActive: false,
                extensionActive: true,
                extensionReturnTxHashAsap: false,
              },
            },
          },
        },
      }),
      getGlobalNetworkClientId: jest.fn().mockReturnValue('mainnet'),
      getAccountType: jest.fn().mockResolvedValue('EthereumAccount'),
      getDeviceModel: jest.fn().mockResolvedValue('Ledger Nano S'),
      getHardwareTypeForMetric: jest.fn().mockResolvedValue('Ledger'),
      trace: jest.fn((_request, fn) => fn?.()),
      trackEvent: jest.fn(),
      ...options,
    } as TestInitRequest;

    return { fullRequest, mocks };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns controller instance', () => {
    const { fullRequest } = buildInitRequest();
    const result = SmartTransactionsControllerInit(fullRequest);

    expect(result.controller).toBeInstanceOf(SmartTransactionsController);
  });

  it('initializes with correct supported chain IDs', () => {
    const { fullRequest } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const expectedChainIds = getAllowedSmartTransactionsChainIds();

    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        supportedChainIds: expectedChainIds,
      }),
    );
  });

  it('initializes with correct client ID', () => {
    const { fullRequest } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: ClientId.Extension,
      }),
    );
  });

  it('initializes with persisted state', () => {
    const persistedState = {
      smartTransactionsState: {
        smartTransactions: {},
        userOptIn: true,
        userOptInV2: true,
        liveness: true,
        fees: {
          approvalTxFees: null,
          tradeTxFees: null,
        },
        feesByChainId: {},
        livenessByChainId: {},
      },
    };
    const { fullRequest } = buildInitRequest({
      persistedState: { SmartTransactionsController: persistedState },
    });

    SmartTransactionsControllerInit(fullRequest);

    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: persistedState,
      }),
    );
  });

  it('passes messenger to controller', () => {
    const { fullRequest } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    // The messenger configuration happens in the initControllers function,
    // not in SmartTransactionsControllerInit, so we just verify it's passed through
    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: fullRequest.controllerMessenger,
      }),
    );
  });

  it('configures getNonceLock correctly', async () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    const { getNonceLock } = constructorCall;

    const address = '0xtest';
    const networkClientId = 'mainnet';
    const result = await getNonceLock(address, networkClientId);

    expect(mocks.transactionController.getNonceLock).toHaveBeenCalledWith(
      address,
      'mainnet',
    );
    expect(result).toHaveProperty('releaseLock');
  });

  it('configures confirmExternalTransaction correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    const { confirmExternalTransaction } = constructorCall;

    const args = ['arg1', 'arg2'] as unknown as Parameters<
      TransactionController['confirmExternalTransaction']
    >;
    confirmExternalTransaction(...args);

    expect(
      mocks.transactionController.confirmExternalTransaction,
    ).toHaveBeenCalledWith(...args);
  });

  it('configures trackMetaMetricsEvent correctly', () => {
    const { fullRequest } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];

    expect(typeof constructorCall.trackMetaMetricsEvent).toBe('function');

    const trackMetaMetricsEvent = constructorCall.trackMetaMetricsEvent as (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;

    const testPayload: MetaMetricsEventPayload = {
      event: 'TestEvent',
      category: 'TestCategory',
      properties: { test: true },
    };

    trackMetaMetricsEvent(testPayload);

    expect(fullRequest.initMessenger.call).toHaveBeenCalledWith(
      'MetaMetricsController:trackEvent',
      testPayload,
    );
  });

  it('configures getTransactions correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    const { getTransactions } = constructorCall;

    const args = [] as Parameters<TransactionController['getTransactions']>;
    getTransactions(...args);

    expect(mocks.transactionController.getTransactions).toHaveBeenCalledWith(
      ...args,
    );
  });

  it('configures updateTransaction correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    const { updateTransaction } = constructorCall;

    const transactionMeta = {
      id: 'txId',
      status: 'confirmed' as const,
    } as Parameters<TransactionController['updateTransaction']>[0];

    const note = 'test note';
    updateTransaction(transactionMeta, note);

    expect(mocks.transactionController.updateTransaction).toHaveBeenCalledWith(
      transactionMeta,
      note,
    );
  });

  describe('getFeatureFlags', () => {
    it('returns feature flags from state', () => {
      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      const { getFeatureFlags } = constructorCall;

      const result = getFeatureFlags();

      expect(fullRequest.getStateUI).toHaveBeenCalled();
      expect(result).toHaveProperty('smartTransactions');
      expect(result.smartTransactions).toHaveProperty('extensionActive');
      expect(result.smartTransactions).toHaveProperty('mobileActive');
      expect(result.smartTransactions).toHaveProperty('expectedDeadline');
      expect(result.smartTransactions).toHaveProperty('maxDeadline');
      expect(result.smartTransactions).toHaveProperty(
        'extensionReturnTxHashAsap',
      );
    });

    it('returns default feature flags when getFeatureFlagsByChainId returns null', () => {
      // To test the null case, we need to make getStateUI return a state
      // that would cause getFeatureFlagsByChainId to return null
      const { fullRequest } = buildInitRequest({
        getStateUI: jest.fn().mockReturnValue({
          metamask: {
            preferences: {},
            selectedNetworkClientId: 'mainnet',
            networkConfigurationsByChainId: {
              '0x1': {
                chainId: '0x1',
                rpcEndpoints: [
                  {
                    networkClientId: 'mainnet',
                    url: 'https://mainnet.infura.io/v3/abc',
                  },
                ],
              },
            },
            // No swapsState to test null case
          },
        }),
      });

      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      const { getFeatureFlags } = constructorCall;

      const result = getFeatureFlags();

      // When getFeatureFlagsByChainId returns null, the result should be null
      expect(result).toBeNull();
    });
  });

  describe('getMetaMetricsProps', () => {
    it('returns correct meta metrics properties', async () => {
      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      const { getMetaMetricsProps } = constructorCall;

      const result = await getMetaMetricsProps();

      expect(result).toEqual({
        accountHardwareType: 'Ledger',
        accountType: 'EthereumAccount',
        deviceModel: 'Ledger Nano S',
      });
    });

    it('uses selected account address for metrics', async () => {
      const selectedAddress = '0xselected';
      const { fullRequest } = buildInitRequest({
        getStateUI: jest.fn().mockReturnValue({
          metamask: {
            internalAccounts: {
              selectedAccount: 'selected-account-id',
              accounts: {
                'selected-account-id': {
                  id: 'selected-account-id',
                  address: selectedAddress,
                  metadata: {
                    name: 'Selected Account',
                  },
                },
              },
            },
            preferences: {
              smartTransactionsOptInStatus: true,
            },
            swapsState: {
              swapsFeatureFlags: {
                ethereum: {
                  extensionActive: true,
                  mobileActive: false,
                },
                smartTransactions: {
                  mobileActive: false,
                  extensionActive: true,
                  extensionReturnTxHashAsap: false,
                },
              },
            },
          },
        }),
      });

      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      const { getMetaMetricsProps } = constructorCall;

      await getMetaMetricsProps();

      expect(fullRequest.getHardwareTypeForMetric).toHaveBeenCalledWith(
        selectedAddress,
      );
      expect(fullRequest.getAccountType).toHaveBeenCalledWith(selectedAddress);
      expect(fullRequest.getDeviceModel).toHaveBeenCalledWith(selectedAddress);
    });
  });
});
