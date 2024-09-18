import { renderHook } from '@testing-library/react-hooks';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import { updateAndApproveTx } from '../store/actions';
import { useMMICustodySendTransaction } from './useMMICustodySendTransaction';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('@metamask-institutional/extension', () => ({
  showCustodianDeepLink: jest.fn(),
}));

jest.mock('../store/institutional/institution-background', () => ({
  mmiActionsFactory: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getAccountType: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  updateAndApproveTx: jest.fn(),
}));

describe('useMMICustodySendTransaction', () => {
  it('handles custody account type', async () => {
    const dispatch = jest.fn();

    useDispatch.mockReturnValue(dispatch);
    useSelector.mockReturnValue('custody');
    mmiActionsFactory.mockReturnValue({
      setWaitForConfirmDeepLinkDialog: jest.fn(),
    });

    const { result } = renderHook(() => useMMICustodySendTransaction());
    await result.current.custodyTransactionFn({
      id: '5f2868d0-6480-11ef-a924-4325b6aee02e',
      txParams: {
        from: '0xe8f748699e2fe0f8133081914473e80bb60df71a',
        data: '0x97c5ed1e00000',
        gas: '0x8609',
        to: '0xfe7a0f0c76c136b9b438dcb27de9a1b618c016fc',
        value: '0x0',
        maxFeePerGas: '0xb232c6726',
        maxPriorityFeePerGas: '0x59682f00',
      },
      type: 'contractInteraction',
      networkClientId: 'sepolia',
    });

    expect(dispatch).toHaveBeenCalled();
    expect(updateAndApproveTx).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '5f2868d0-6480-11ef-a924-4325b6aee02e',
      }),
      true,
      '',
    );
  });

  it('handles non-custody account type', async () => {
    const dispatch = jest.fn();
    const mockHistoryPush = jest.fn();
    useHistory.mockReturnValue({ push: mockHistoryPush });

    useDispatch.mockReturnValue(dispatch);
    useSelector.mockReturnValue('non-custody');
    mmiActionsFactory.mockReturnValue({
      setWaitForConfirmDeepLinkDialog: jest.fn(),
    });

    const { result } = renderHook(() => useMMICustodySendTransaction());
    await result.current.custodyTransactionFn({
      id: '5f2868d0-6480-11ef-a924-4325b6aee02e',
      txParams: {
        from: '0xe8f748699e2fe0f8133081914473e80bb60df71a',
        data: '0x97c5ed1e00000',
        gas: '0x8609',
        to: '0xfe7a0f0c76c136b9b438dcb27de9a1b618c016fc',
        value: '0x0',
        maxFeePerGas: '0xb232c6726',
        maxPriorityFeePerGas: '0x59682f00',
      },
      type: 'contractInteraction',
      networkClientId: 'sepolia',
    });

    expect(dispatch).toHaveBeenCalled();
    expect(mockHistoryPush).toHaveBeenCalled();
    expect(updateAndApproveTx).toHaveBeenCalled();
  });
});
