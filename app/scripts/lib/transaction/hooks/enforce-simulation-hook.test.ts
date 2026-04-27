import {
  TransactionContainerType,
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { TransactionControllerInitMessenger } from '../../../messenger-client-init/messengers/transaction-controller-messenger';
import { applyTransactionContainers } from '../containers/util';
import { EnforceSimulationHook } from './enforce-simulation-hook';

jest.mock('../containers/util');

const BALANCE_CHANGE_MOCK = {
  difference: '0x1' as Hex,
  isDecrease: true,
  previousBalance: '0x1' as Hex,
  newBalance: '0x0' as Hex,
};

const TRANSACTION_META_MOCK: TransactionMeta = {
  chainId: '0x1',
  delegationAddress: '0x234567890abcdef1234567890abcdef12345678',
  id: '123-456',
  networkClientId: 'mainnet',
  origin: 'test.com',
  simulationData: {
    nativeBalanceChange: BALANCE_CHANGE_MOCK,
    tokenBalanceChanges: [],
  },
  status: TransactionStatus.unapproved,
  time: 123,
  txParams: {
    from: '0x01234567890abcdef1234567890abcdef1234567',
    to: '0x1234567890abcdef1234567890abcdef12345678',
  },
  txParamsOriginal: {
    from: '0x01234567890abcdef1234567890abcdef1234567',
    to: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

describe('EnforceSimulationHook', () => {
  let messenger: TransactionControllerInitMessenger;
  const isEligibleMock = jest.fn();

  const applyTransactionContainersMock = jest.mocked(
    applyTransactionContainers,
  );

  beforeEach(() => {
    jest.resetAllMocks();

    isEligibleMock.mockReturnValue(true);

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: jest.fn(),
    });

    const baseMessenger = new Messenger<MockAnyNamespace, never, never>({
      namespace: MOCK_ANY_NAMESPACE,
    });

    messenger = new Messenger<
      'TransactionControllerInitMessenger',
      never,
      never,
      typeof baseMessenger
    >({
      namespace: 'TransactionControllerInitMessenger',
      parent: baseMessenger,
    });
  });

  it('applies containers with isApproved at beforeSign', async () => {
    const updateTransactionMock = jest.fn();

    applyTransactionContainersMock.mockResolvedValue({
      updateTransaction: updateTransactionMock,
    });

    const hook = new EnforceSimulationHook({
      messenger,
      isEligible: isEligibleMock,
    }).getBeforeSignHook();

    const { updateTransaction } =
      (await hook({
        transactionMeta: {
          ...TRANSACTION_META_MOCK,
          containerTypes: [TransactionContainerType.EnforcedSimulations],
        },
      })) ?? {};

    expect(updateTransaction).toBe(updateTransactionMock);

    expect(applyTransactionContainersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isApproved: true,
      }),
    );
  });

  describe('does nothing if', () => {
    it('not eligible', async () => {
      isEligibleMock.mockReturnValue(false);

      const hook = new EnforceSimulationHook({
        messenger,
        isEligible: isEligibleMock,
      }).getBeforeSignHook();

      const result = await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      });

      expect(applyTransactionContainersMock).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('no container types set', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
        isEligible: isEligibleMock,
      }).getBeforeSignHook();

      const result = await hook({
        transactionMeta: TRANSACTION_META_MOCK,
      });

      expect(applyTransactionContainersMock).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('container types exist but enforced simulations not included', async () => {
      const hook = new EnforceSimulationHook({
        messenger,
        isEligible: isEligibleMock,
      }).getBeforeSignHook();

      const result = await hook({
        transactionMeta: {
          ...TRANSACTION_META_MOCK,
          containerTypes: [],
        },
      });

      expect(applyTransactionContainersMock).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });
  });
});
