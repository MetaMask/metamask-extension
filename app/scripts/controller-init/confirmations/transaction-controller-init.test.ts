import { NetworkController } from '@metamask/network-controller';
// Mocha type definitions are conflicting with Jest
import { it as jestIt } from '@jest/globals';
import {
  TransactionMeta,
  TransactionType,
  TransactionController,
  TransactionControllerMessenger,
  TransactionControllerOptions,
  TransactionStatus,
  PublishHook,
} from '@metamask/transaction-controller';
import { TransactionPayPublishHook } from '@metamask/transaction-pay-controller';
import {
  getTransactionControllerInitMessenger,
  getTransactionControllerMessenger,
  TransactionControllerInitMessenger,
} from '../messengers/transaction-controller-messenger';
import { getRootMessenger } from '../../lib/messenger';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { ControllerInitRequest } from '../types';
import * as smartTransactionsModule from '../../lib/smart-transaction/smart-transactions';
import * as sentinelApiModule from '../../lib/transaction/sentinel-api';
import { Delegation7702PublishHook } from '../../lib/transaction/hooks/delegation-7702-publish';
import { TransactionControllerInit } from './transaction-controller-init';

jest.mock('@metamask/transaction-controller');
jest.mock('@metamask/transaction-pay-controller');
jest.mock('../../lib/smart-transaction/smart-transactions');
jest.mock('../../lib/transaction/sentinel-api');
jest.mock('../../lib/transaction/hooks/delegation-7702-publish');

/**
 * Build a mock NetworkController.
 *
 * @param partialMock - A partial mock object for the NetworkController, merged
 * with the default mock.
 * @returns A mock NetworkController.
 */
function buildControllerMock(
  partialMock?: Partial<NetworkController>,
): NetworkController {
  const defaultNetworkControllerMock = {
    getNetworkClientRegistry: jest.fn().mockReturnValue({}),
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultNetworkControllerMock,
    ...partialMock,
  };
}

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TransactionControllerMessenger,
    TransactionControllerInitMessenger
  >
> {
  const baseControllerMessenger = getRootMessenger();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTransactionControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getTransactionControllerInitMessenger(
      baseControllerMessenger,
    ),
  };

  requestMock.getController.mockReturnValue(buildControllerMock());

  return requestMock;
}

describe('Transaction Controller Init', () => {
  const transactionControllerClassMock = jest.mocked(TransactionController);
  const transactionPayPublishHookClassMock = jest.mocked(
    TransactionPayPublishHook,
  );
  const payHookMock: jest.MockedFn<PublishHook> = jest.fn();

  /**
   * Extract a constructor option passed to the controller.
   *
   * @param option - The option to extract.
   * @param dependencyProperties - Any properties required on the controller dependencies.
   * @returns The extracted option.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  function testConstructorOption<T extends keyof TransactionControllerOptions>(
    option: T,
    dependencyProperties: Record<string, unknown> = {},
  ): TransactionControllerOptions[T] {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockReturnValue(
      buildControllerMock(dependencyProperties),
    );

    TransactionControllerInit(requestMock);

    return transactionControllerClassMock.mock.calls[0][0][option];
  }

  beforeEach(() => {
    jest.resetAllMocks();

    transactionPayPublishHookClassMock.mockReturnValue({
      getHook: () => payHookMock,
    } as unknown as TransactionPayPublishHook);

    payHookMock.mockResolvedValue({
      transactionHash: undefined,
    });

    jest
      .mocked(smartTransactionsModule.getSmartTransactionCommonParams)
      .mockReturnValue({
        isSmartTransaction: false,
        featureFlags: {
          smartTransactions: {
            extensionReturnTxHashAsap: false,
            extensionReturnTxHashAsapBatch: false,
            extensionSkipSmartTransactionStatusPage: false,
            mobileActive: false,
            extensionActive: false,
          },
        },
        isHardwareWalletAccount: false,
      });

    jest
      .mocked(sentinelApiModule.isSendBundleSupported)
      .mockResolvedValue(false);

    const delegation7702HookMock: jest.MockedFn<PublishHook> = jest.fn();
    delegation7702HookMock.mockResolvedValue({ transactionHash: undefined });
    jest.mocked(Delegation7702PublishHook).mockImplementation(
      () =>
        ({
          getHook: () => delegation7702HookMock,
        }) as unknown as Delegation7702PublishHook,
    );
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(TransactionControllerInit(requestMock).controller).toBeInstanceOf(
      TransactionController,
    );
  });

  it('retrieves saved gas fees from preferences', () => {
    const getSavedGasFees = testConstructorOption('getSavedGasFees', {
      state: {
        advancedGasFee: {
          [CHAIN_ID_MOCK]: {
            maxBaseFee: '0x1',
            priorityFee: '0x2',
          },
        },
      },
    });

    expect(getSavedGasFees?.(CHAIN_ID_MOCK)).toStrictEqual({
      maxBaseFee: '0x1',
      priorityFee: '0x2',
    });
  });

  describe('determines incoming transactions is enabled', () => {
    it('when useExternalServices is enabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            useExternalServices: true,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(true);
    });

    it('unless enabled in preferences but onboarding incomplete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: false,
            useExternalServices: true,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });

    it('unless disabled in preferences and onboarding complete', () => {
      const incomingTransactionsIsEnabled = testConstructorOption(
        'incomingTransactions',
        {
          state: {
            completedOnboarding: true,
            useExternalServices: false,
          },
        },
      )?.isEnabled;

      expect(incomingTransactionsIsEnabled?.()).toBe(false);
    });
  });

  it('determines if first time interaction enabled using preference', () => {
    const isFirstTimeInteractionEnabled = testConstructorOption(
      'isFirstTimeInteractionEnabled',
      {
        state: {
          securityAlertsEnabled: true,
        },
      },
    );

    expect(isFirstTimeInteractionEnabled?.()).toBe(true);
  });

  it('determines if simulation enabled using preference', () => {
    const isSimulationEnabled = testConstructorOption('isSimulationEnabled', {
      state: {
        useTransactionSimulations: true,
      },
    });

    expect(isSimulationEnabled?.()).toBe(true);
  });

  it('always disables pending transaction resubmit', () => {
    const pendingTransactions = testConstructorOption('pendingTransactions');

    expect(pendingTransactions?.isResubmitEnabled?.()).toBe(false);
  });

  jestIt.each([
    ['swap', TransactionType.swap, false],
    ['swapApproval', TransactionType.swapApproval, false],
    ['bridge', TransactionType.bridge, false],
    ['bridgeApproval', TransactionType.bridgeApproval, false],
    ['contractInteraction', TransactionType.contractInteraction, true],
  ])(
    'disables automatic gas fee updates for %s transactions',
    (_label, type, gasFeeUpdateEnabled) => {
      const isAutomaticGasFeeUpdateEnabled = testConstructorOption(
        'isAutomaticGasFeeUpdateEnabled',
      );

      const tx: TransactionMeta = {
        id: '1',
        type,
        chainId: CHAIN_ID_MOCK,
        networkClientId: 'test-network',
        status: TransactionStatus.unapproved,
        time: Date.now(),
        txParams: {
          from: '0x0000000000000000000000000000000000000000',
        },
      };

      expect(isAutomaticGasFeeUpdateEnabled?.(tx)).toBe(gasFeeUpdateEnabled);
    },
  );

  describe('publish hook', () => {
    const mockTransactionMeta: TransactionMeta = {
      id: '123',
      chainId: CHAIN_ID_MOCK,
      status: TransactionStatus.approved,
      time: Date.now(),
      txParams: {
        from: '0x0000000000000000000000000000000000000000',
      },
      networkClientId: 'test-network',
    };

    it('calls TransactionPayPublishHook', async () => {
      const hooks = testConstructorOption('hooks');

      await hooks?.publish?.(mockTransactionMeta);

      expect(payHookMock).toHaveBeenCalledTimes(1);
    });

    it('returns pay hook result when transactionHash is present', async () => {
      payHookMock.mockResolvedValue({
        transactionHash: '0xpayHash',
      });

      const hooks = testConstructorOption('hooks');

      const result = await hooks?.publish?.(mockTransactionMeta);

      expect(result).toStrictEqual({ transactionHash: '0xpayHash' });
    });
  });
});
