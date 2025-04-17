import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import {
  getSelectedAccountCachedBalance,
  selectMaxValueModeForTransaction,
} from '../../../../../../selectors';
import { useMaxValueRefresher } from './useMaxValueRefresher';
import { useSupportsEIP1559 } from './useSupportsEIP1559';

jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: jest
    .fn()
    .mockImplementation((selector: () => void) => selector()),
}));

jest.mock('../../../../../../store/actions', () => ({
  updateEditableParams: jest.fn(),
}));

jest.mock('../../../../../../selectors', () => ({
  getSelectedAccountCachedBalance: jest.fn(),
  selectMaxValueModeForTransaction: jest.fn(),
}));

jest.mock('../../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../hooks/useTransactionEventFragment');

jest.mock('./useSupportsEIP1559', () => ({
  useSupportsEIP1559: jest.fn(),
}));

const BALANCE_MOCK = '0x111';

describe('useMaxValueRefresher', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useSupportsEIP1559Mock = jest.mocked(useSupportsEIP1559);
  const updateTransactionEventFragmentMock = jest.fn();
  const useTransactionEventFragmentMock = jest.mocked(
    useTransactionEventFragment,
  );
  const getSelectedAccountCachedBalanceMock = jest.mocked(
    getSelectedAccountCachedBalance,
  );
  const selectMaxValueModeForTransactionMock = jest.mocked(
    selectMaxValueModeForTransaction,
  );
  const updateEditableParamsMock = jest.mocked(updateEditableParams);
  const simpleSendTransactionMetaMock = {
    id: '1',
    type: TransactionType.simpleSend,
    txParams: {
      gas: '0x001',
      gasPrice: '0x002',
      maxFeePerGas: '0x001',
    },
    gasFeeEstimates: {
      medium: {
        maxFeePerGas: '0x001',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: simpleSendTransactionMetaMock,
    } as unknown as ReturnType<typeof useConfirmContext>);
    useSupportsEIP1559Mock.mockReturnValue({
      supportsEIP1559: true,
    });
    getSelectedAccountCachedBalanceMock.mockImplementation(() => BALANCE_MOCK);
    selectMaxValueModeForTransactionMock.mockImplementation(() => true);
    useTransactionEventFragmentMock.mockImplementation(() => ({
      updateTransactionEventFragment: updateTransactionEventFragmentMock,
    }));
  });

  it('does not update transaction value if max value mode is not enabled', () => {
    selectMaxValueModeForTransactionMock.mockImplementation(() => false);
    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });

  it('does not update transaction value if transaction type is not simpleSend', () => {
    useConfirmContextMock.mockReturnValue({
      currentConfirmation: {
        ...simpleSendTransactionMetaMock,
        type: TransactionType.contractInteraction,
      },
    } as unknown as ReturnType<typeof useConfirmContext>);
    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });

  it('updates transaction event fragment', () => {
    renderHook(() => useMaxValueRefresher());

    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      {
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_send_max: true,
        },
      },
      simpleSendTransactionMetaMock.id,
    );
  });

  describe('updates transaction value', () => {
    it('with expected value', () => {
      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0x110',
        },
      );
    });

    it('if EIP-1559 is not supported', () => {
      useSupportsEIP1559Mock.mockReturnValue({
        supportsEIP1559: false,
      });
      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0x10f',
        },
      );
    });

    it('if custom estimation is used', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          ...simpleSendTransactionMetaMock,
          txParams: {
            maxFeePerGas: '0x020',
            gas: '0x001',
          },
          estimateUsed: 'custom',
        },
      } as unknown as ReturnType<typeof useConfirmContext>);

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0x110',
        },
      );
    });

    it('if userFeeLevel is one of GasFeeEstimateLevel', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          ...simpleSendTransactionMetaMock,
          txParams: {
            maxFeePerGas: '0x020',
            gas: '0x001',
          },
          gasFeeEstimates: {
            low: {
              maxFeePerGas: '0x010',
            },
          },
        },
      } as unknown as ReturnType<typeof useConfirmContext>);

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0x111',
        },
      );
    });

    it('if legacy gas estimation is used', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          ...simpleSendTransactionMetaMock,
          gasFeeEstimates: {
            medium: '0x020',
          },
          txParams: {
            gas: '0x001',
          },
        },
      } as unknown as ReturnType<typeof useConfirmContext>);

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0xf1',
        },
      );
    });

    it('if gas price gas estimation is used', () => {
      useConfirmContextMock.mockReturnValue({
        currentConfirmation: {
          ...simpleSendTransactionMetaMock,
          gasFeeEstimates: {
            gasPrice: '0x020',
          },
          txParams: {
            gas: '0x001',
          },
        },
      } as unknown as ReturnType<typeof useConfirmContext>);

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        simpleSendTransactionMetaMock.id,
        {
          value: '0xf1',
        },
      );
    });
  });
});
