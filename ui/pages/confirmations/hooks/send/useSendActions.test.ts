import { TransactionMeta } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET, SOLANA_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import * as SendUtils from '../../utils/send';
import * as MultichainTransactionUtils from '../../utils/multichain-snaps';
import * as SendContext from '../../context/send';
import { useSendActions } from './useSendActions';

const MOCK_ADDRESS_1 = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';
const MOCK_ADDRESS_2 = '0xd12662965960f3855a09f85396459429a595d741';
const MOCK_ADDRESS_3 = '4Nd1m5PztHZbA1FtdYzWxTjLdQdHZr4sqoZKxK3x3hJv';
const MOCK_ADDRESS_4 = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

beforeEach(() => {
  mockUseNavigate.mockClear();
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => (fn: () => void) => {
    if (fn) {
      fn();
    }
  },
}));

function renderHook() {
  const { result } = renderHookWithProvider(useSendActions, mockState);
  return result.current;
}

describe('useSendQueryParams', () => {
  it('result returns method handleCancel to cancel send', () => {
    const result = renderHook();
    result.handleCancel();
    expect(mockUseNavigate).toHaveBeenCalledWith('/');
  });

  it('result returns method handleBack to goto previous page', () => {
    const result = renderHook();
    result.handleBack();
    expect(mockUseNavigate).toHaveBeenCalledWith(-1);
  });

  it('handleSubmit is able to submit evm send', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: 10,
      maxValueMode: true,
      updateNonEVMSubmitError: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockSubmitEvmTransaction = jest
      .spyOn(SendUtils, 'submitEvmTransaction')
      .mockImplementation(() =>
        Promise.resolve(() =>
          Promise.resolve({} as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_2);

    expect(mockSubmitEvmTransaction).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        '/confirm-transaction?maxValueMode=true',
      );
    });
  });

  it('handleSubmit is able to submit non-evm send', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '10',
      updateNonEVMSubmitError: jest.fn(),
    } as unknown as SendContext.SendContextType);

    const mockSubmitNonEvmTransaction = jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.resolve({ transactionId: 'tx123', status: 'submitted' }),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      expect(mockSubmitNonEvmTransaction).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith('/?tab=activity');
    });
  });

  it('handleSubmit handles snap validation errors for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '10',
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.resolve({
          valid: false,
          errors: [{ code: 'InsufficientBalance' }],
        }),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      expect(mockUpdateNonEVMSubmitError).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('handleSubmit handles valid: false without errors array for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '10',
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.resolve({
          valid: false,
          // No errors array - should still show generic error
        }),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      // Should show generic error message when valid: false but no errors array
      expect(mockUpdateNonEVMSubmitError).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('handleSubmit handles user rejection (code 4001) for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '10',
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    const userRejectionError = Object.assign(new Error('User rejected'), {
      code: 4001,
    });
    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() => Promise.reject(userRejectionError));

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      // Should clear error for user rejection
      expect(mockUpdateNonEVMSubmitError).toHaveBeenCalledWith(undefined);
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('handleSubmit displays generic error for non-rejection snap errors', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '10',
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.reject(new Error('Unexpected snap error')),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      // Should set generic error message for non-rejection errors
      expect(mockUpdateNonEVMSubmitError).toHaveBeenCalledWith(
        expect.any(String),
      );
      // The last call should NOT be undefined (not a user rejection)
      const lastCall =
        mockUpdateNonEVMSubmitError.mock.calls[
          mockUpdateNonEVMSubmitError.mock.calls.length - 1
        ];
      expect(lastCall[0]).not.toBeUndefined();
      expect(mockUseNavigate).toHaveBeenCalledWith(-1);
    });
  });
});
