import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { Messenger } from '@metamask/base-controller';
import type { Hex } from '@metamask/utils';
import { buildControllerInitRequestMock } from '../test/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getFeatureFlagsByChainId } from '../../../../shared/modules/selectors';
import { SmartTransactionsControllerInit } from './smart-transactions-controller-init';

jest.mock('@metamask/smart-transactions-controller');
jest.mock('../../../../shared/constants/smartTransactions');
jest.mock('../../../../shared/modules/selectors');

describe('SmartTransactionsController Init', () => {
  const smartTransactionsControllerClassMock = jest.mocked(
    SmartTransactionsController,
  );
  const getAllowedSmartTransactionsChainIdsMock = jest.mocked(
    getAllowedSmartTransactionsChainIds,
  );
  const getFeatureFlagsByChainIdMock = jest.mocked(getFeatureFlagsByChainId);

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
    };

    baseControllerMessenger.getRestricted = jest
      .fn()
      .mockReturnValue(restrictedMessenger);

    const accountsController = {
      getSelectedAccount: jest.fn().mockReturnValue({ address: '0x123' }),
    };

    const transactionController = {
      getNonceLock: jest.fn(),
      confirmExternalTransaction: jest.fn(),
      getTransactions: jest.fn(),
      updateTransaction: jest.fn(),
    };

    const metaMetricsController = {
      trackEvent: jest.fn(),
    };

    return {
      baseControllerMessenger,
      restrictedMessenger,
      accountsController,
      transactionController,
      metaMetricsController,
    };
  }

  /**
   * Build the init request with custom options.
   *
   * @param options - Custom options to override defaults
   * @returns A complete init request object
   */
  function buildInitRequest(options: Record<string, unknown> = {}) {
    const mocks = buildMockDependencies();
    const requestMock = buildControllerInitRequestMock();

    const fullRequest = {
      ...requestMock,
      baseControllerMessenger: mocks.baseControllerMessenger,
      getController: jest.fn((name: string) => {
        switch (name) {
          case 'AccountsController':
            return mocks.accountsController;
          case 'TransactionController':
            return mocks.transactionController;
          case 'MetaMetricsController':
            return mocks.metaMetricsController;
          default:
            return {};
        }
      }),
      persistedState: {
        SmartTransactionsController: {
          smartTransactionsState: {
            liveness: true,
          },
        },
      },
      getStateUI: jest.fn().mockReturnValue({
        metamask: {
          preferences: {
            smartTransactionsOptInStatus: true,
          },
        },
      }),
      getGlobalNetworkClientId: jest.fn().mockReturnValue('mainnet'),
      getAccountType: jest.fn().mockResolvedValue('EthereumAccount'),
      getDeviceModel: jest.fn().mockResolvedValue('Ledger Nano S'),
      getHardwareTypeForMetric: jest.fn().mockResolvedValue('Ledger'),
      ...options,
    };

    return { fullRequest, mocks };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    getAllowedSmartTransactionsChainIdsMock.mockReturnValue([
      '0x1',
      '0x5',
      '0xaa36a7',
    ] as Hex[]);
    getFeatureFlagsByChainIdMock.mockReturnValue({
      smartTransactions: {
        mobileActive: false,
        extensionActive: true,
        extensionReturnTxHashAsap: false,
      },
    });
  });

  it('returns controller instance', () => {
    const { fullRequest } = buildInitRequest();
    const result = SmartTransactionsControllerInit(fullRequest);

    expect(result.controller).toBeInstanceOf(SmartTransactionsController);
  });

  it('initializes with correct supported chain IDs', () => {
    const { fullRequest } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    expect(getAllowedSmartTransactionsChainIdsMock).toHaveBeenCalled();
    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        supportedChainIds: ['0x1', '0x5', '0xaa36a7'],
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
        liveness: true,
        fees: {},
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

  it('configures messenger with correct permissions', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    expect(mocks.baseControllerMessenger.getRestricted).toHaveBeenCalledWith({
      name: 'SmartTransactionsController',
      allowedActions: [
        'NetworkController:getNetworkClientById',
        'NetworkController:getState',
      ],
      allowedEvents: ['NetworkController:stateChange'],
    });

    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: mocks.restrictedMessenger,
      }),
    );
  });

  it('configures getNonceLock correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    // Type assertion to avoid TypeScript errors
    const getNonceLock = constructorCall.getNonceLock as (
      address: string,
    ) => unknown;

    const address = '0xtest';
    getNonceLock(address);

    expect(mocks.transactionController.getNonceLock).toHaveBeenCalledWith(
      address,
      'mainnet',
    );
  });

  it('configures confirmExternalTransaction correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    // Type assertion to avoid TypeScript errors
    const confirmExternalTransaction =
      constructorCall.confirmExternalTransaction as (
        ...args: unknown[]
      ) => unknown;

    const args = ['arg1', 'arg2'];
    confirmExternalTransaction(...args);

    expect(
      mocks.transactionController.confirmExternalTransaction,
    ).toHaveBeenCalledWith(...args);
  });

  it('configures trackMetaMetricsEvent correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    // Type assertion to avoid TypeScript errors
    const trackMetaMetricsEvent = constructorCall.trackMetaMetricsEvent as (
      event: unknown,
    ) => unknown;

    const eventArgs = { event: 'test', properties: {} };
    trackMetaMetricsEvent(eventArgs);

    expect(mocks.metaMetricsController.trackEvent).toHaveBeenCalledWith(
      eventArgs,
    );
  });

  it('configures getTransactions correctly', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    const constructorCall =
      smartTransactionsControllerClassMock.mock.calls[0][0];
    // Type assertion to avoid TypeScript errors
    const getTransactions = constructorCall.getTransactions as (
      ...args: unknown[]
    ) => unknown;

    const args = [{ status: 'submitted' }];
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
    // Type assertion to avoid TypeScript errors
    const updateTransaction = constructorCall.updateTransaction as (
      ...args: unknown[]
    ) => unknown;

    const args = ['txId', { status: 'confirmed' }];
    updateTransaction(...args);

    expect(mocks.transactionController.updateTransaction).toHaveBeenCalledWith(
      ...args,
    );
  });

  describe('getFeatureFlags', () => {
    it('returns feature flags from state', () => {
      const expectedFlags = {
        smartTransactions: {
          mobileActive: true,
          extensionActive: false,
          extensionReturnTxHashAsap: true,
        },
      };

      getFeatureFlagsByChainIdMock.mockReturnValue(expectedFlags);

      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getFeatureFlags = constructorCall.getFeatureFlags as () => unknown;

      const result = getFeatureFlags();

      expect(fullRequest.getStateUI).toHaveBeenCalled();
      expect(getFeatureFlagsByChainIdMock).toHaveBeenCalledWith(
        fullRequest.getStateUI(),
      );
      expect(result).toEqual(expectedFlags);
    });

    it('returns default feature flags when flags is null', () => {
      getFeatureFlagsByChainIdMock.mockReturnValue(null);

      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getFeatureFlags = constructorCall.getFeatureFlags as () => unknown;

      const result = getFeatureFlags();

      expect(result).toEqual({
        smartTransactions: {
          mobileActive: false,
          extensionActive: false,
          extensionReturnTxHashAsap: false,
        },
      });
    });
  });

  describe('getMetaMetricsProps', () => {
    it('returns correct meta metrics properties', async () => {
      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getMetaMetricsProps =
        constructorCall.getMetaMetricsProps as () => Promise<unknown>;

      const result = await getMetaMetricsProps();

      expect(result).toEqual({
        accountHardwareType: 'Ledger',
        accountType: 'EthereumAccount',
        deviceModel: 'Ledger Nano S',
      });
    });

    it('uses selected account address for metrics', async () => {
      const selectedAddress = '0xselected';
      const { fullRequest, mocks } = buildInitRequest();

      mocks.accountsController.getSelectedAccount.mockReturnValue({
        address: selectedAddress,
      });

      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getMetaMetricsProps =
        constructorCall.getMetaMetricsProps as () => Promise<unknown>;

      await getMetaMetricsProps();

      expect(mocks.accountsController.getSelectedAccount).toHaveBeenCalled();
      expect(fullRequest.getHardwareTypeForMetric).toHaveBeenCalledWith(
        selectedAddress,
      );
      expect(fullRequest.getAccountType).toHaveBeenCalledWith(selectedAddress);
      expect(fullRequest.getDeviceModel).toHaveBeenCalledWith(selectedAddress);
    });
  });
});
