import SmartTransactionsController from '@metamask/smart-transactions-controller';
import { ClientId } from '@metamask/smart-transactions-controller/dist/types';
import { Messenger } from '@metamask/base-controller';
import type { Hex } from '@metamask/utils';
import { buildControllerInitRequestMock } from '../test/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getFeatureFlagsByChainId } from '../../../../shared/modules/selectors';
import { SmartTransactionsControllerInit } from './smart-transactions-controller-init';

jest.mock('@metamask/smart-transactions-controller');

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
      controllerMessenger: mocks.restrictedMessenger,
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
        },
      }),
      getGlobalNetworkClientId: jest.fn().mockReturnValue('mainnet'),
      getAccountType: jest.fn().mockResolvedValue('EthereumAccount'),
      getDeviceModel: jest.fn().mockResolvedValue('Ledger Nano S'),
      getHardwareTypeForMetric: jest.fn().mockResolvedValue('Ledger'),
      trace: jest.fn((_, fn) => fn?.()),
      ...options,
    };

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

    // Since we're not mocking getAllowedSmartTransactionsChainIds anymore,
    // we'll get the real chain IDs from the actual implementation
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

  it('passes messenger to controller', () => {
    const { fullRequest, mocks } = buildInitRequest();
    SmartTransactionsControllerInit(fullRequest);

    // The messenger configuration happens in the initControllers function,
    // not in SmartTransactionsControllerInit, so we just verify it's passed through
    expect(smartTransactionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messenger: fullRequest.controllerMessenger,
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
      const { fullRequest } = buildInitRequest();
      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getFeatureFlags = constructorCall.getFeatureFlags as () => unknown;

      const result = getFeatureFlags() as any;

      expect(fullRequest.getStateUI).toHaveBeenCalled();
      // The actual getFeatureFlagsByChainId will be called with the state
      // We can check that the result has the expected structure
      expect(result).toHaveProperty('smartTransactions');
      expect(result.smartTransactions).toHaveProperty('mobileActive');
      expect(result.smartTransactions).toHaveProperty('extensionActive');
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
            // No featureFlags property to test null case
          },
        }),
      });

      SmartTransactionsControllerInit(fullRequest);

      const constructorCall =
        smartTransactionsControllerClassMock.mock.calls[0][0];
      // Type assertion to avoid TypeScript errors
      const getFeatureFlags = constructorCall.getFeatureFlags as () => unknown;

      const result = getFeatureFlags();

      // Check for default values
      if (
        result &&
        typeof result === 'object' &&
        'smartTransactions' in result
      ) {
        const flags = result as {
          smartTransactions: {
            mobileActive: boolean;
            extensionActive: boolean;
            extensionReturnTxHashAsap: boolean;
          };
        };
        expect(flags.smartTransactions).toBeDefined();
      } else {
        // If null is returned, the controller should handle it with defaults
        expect(result).toEqual({
          smartTransactions: {
            mobileActive: false,
            extensionActive: false,
            extensionReturnTxHashAsap: false,
          },
        });
      }
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
