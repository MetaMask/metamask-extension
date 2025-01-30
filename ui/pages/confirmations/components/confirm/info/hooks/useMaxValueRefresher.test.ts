import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { useFeeCalculations } from './useFeeCalculations';
import { useMaxValueRefresher } from './useMaxValueRefresher';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../store/actions', () => ({
  updateEditableParams: jest.fn(),
}));

jest.mock('../../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../hooks/useFeeCalculations', () => ({
  useFeeCalculations: jest.fn(),
}));

describe('useMaxValueRefresher', () => {
  const dispatchMock = jest.fn();
  const simpleSendTransactionMetaMock = {
    id: '1',
    type: TransactionType.simpleSend,
  };

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(dispatchMock);
    (useConfirmContext as jest.Mock).mockReturnValue({
      currentConfirmation: simpleSendTransactionMetaMock,
    });
    jest.clearAllMocks();
  });

  it('updates transaction value in max amount mode for simpleSend', () => {
    const balance = '0x111';
    const preciseNativeFeeInHex = '0x001';
    const newValue = '0x110';

    (useSelector as jest.Mock)
      .mockReturnValueOnce(balance)
      .mockReturnValueOnce(true);

    (useFeeCalculations as jest.Mock).mockReturnValue({
      preciseNativeFeeInHex,
    });

    renderHook(() => useMaxValueRefresher());

    expect(dispatchMock).toHaveBeenCalledWith(
      updateEditableParams(simpleSendTransactionMetaMock.id, {
        value: newValue,
      }),
    );
  });

  it('does not update transaction value if not in max amount mode', () => {
    (useSelector as jest.Mock)
      .mockReturnValueOnce('0x111')
      .mockReturnValueOnce(false);

    renderHook(() => useMaxValueRefresher());

    expect(dispatchMock).not.toHaveBeenCalled();
  });

  it('does not update transaction value if transaction type is not simpleSend', () => {
    const transactionMeta = { id: '1', type: 'otherType' };
    (useConfirmContext as jest.Mock).mockReturnValue({
      currentConfirmation: transactionMeta,
    });

    renderHook(() => useMaxValueRefresher());

    expect(dispatchMock).not.toHaveBeenCalled();
  });
});
