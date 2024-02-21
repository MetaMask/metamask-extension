import { renderHook } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { mmiActionsFactory } from '../store/institutional/institution-background';
import {
  resolvePendingApproval,
  completedTx,
  showModal,
} from '../store/actions';
import { useMMICustodySignMessage } from './useMMICustodySignMessage';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../store/institutional/institution-background', () => ({
  mmiActionsFactory: jest.fn(),
}));

jest.mock('../selectors', () => ({
  getAccountType: jest.fn(),
}));

jest.mock('../store/actions', () => ({
  resolvePendingApproval: jest.fn(),
  completedTx: jest.fn(),
  showModal: jest.fn(),
}));

describe('useMMICustodySignMessage', () => {
  it('handles custody account type', async () => {
    const dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockReturnValue('custody');
    mmiActionsFactory.mockReturnValue({
      setWaitForConfirmDeepLinkDialog: jest.fn(),
    });

    const { result } = renderHook(() => useMMICustodySignMessage());
    await result.current.custodySignFn({ id: '123' });

    expect(dispatch).toHaveBeenCalled();
    expect(resolvePendingApproval).toHaveBeenCalledWith('123');
    expect(completedTx).toHaveBeenCalledWith('123');
  });

  it('handles non-custody account type', async () => {
    const dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockReturnValue('non-custody');
    mmiActionsFactory.mockReturnValue({
      setWaitForConfirmDeepLinkDialog: jest.fn(),
    });

    const { result } = renderHook(() => useMMICustodySignMessage());
    await result.current.custodySignFn({ id: '456' });

    expect(dispatch).toHaveBeenCalled();
    expect(resolvePendingApproval).toHaveBeenCalledWith('456');
    expect(completedTx).toHaveBeenCalledWith('456');
  });

  it('handles error in custody account type', async () => {
    const dispatch = jest.fn();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockReturnValue('custody');
    mmiActionsFactory.mockReturnValue({
      setWaitForConfirmDeepLinkDialog: jest.fn(),
    });
    resolvePendingApproval.mockImplementation(() => {
      throw new Error('Test error');
    });

    const { result } = renderHook(() => useMMICustodySignMessage());
    await result.current.custodySignFn({ id: '789' });

    expect(dispatch).toHaveBeenCalled();
    expect(showModal).toHaveBeenCalledWith({
      name: 'TRANSACTION_FAILED',
      errorMessage: 'Test error',
      closeNotification: true,
      operationFailed: true,
    });
  });
});
