/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMeta } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';

import mockState from '../../../../../test/data/mock-state.json';
import { EVM_ASSET, SOLANA_ASSET } from '../../../../../test/data/send/assets';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import {
  DEFAULT_ROUTE,
  PREVIOUS_ROUTE,
} from '../../../../helpers/constants/routes';
import { setMaxValueMode } from '../../../../ducks/send-max-value/send-max-value';
import * as SendUtils from '../../utils/send';
import * as MultichainTransactionUtils from '../../utils/multichain-snaps';
import * as SendContext from '../../context/send';
import { NonEvmSendUnknownValue } from './metrics/useNonEvmSendMetrics';
import { useSendActions } from './useSendActions';

const MOCK_ADDRESS_1 = '0xdB055877e6c13b6A6B25aBcAA29B393777dD0a73';
const MOCK_ADDRESS_2 = '0xd12662965960f3855a09f85396459429a595d741';
const MOCK_ADDRESS_3 = '4Nd1m5PztHZbA1FtdYzWxTjLdQdHZr4sqoZKxK3x3hJv';
const MOCK_ADDRESS_4 = '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin';

const mockUseNavigate = jest.fn();
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const mockDispatch = jest.fn((action) =>
  typeof action === 'function' ? action() : action,
);
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockTrackEvent = jest.fn();
jest.mock('../../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../../shared/lib/analytics/create-event-builder',
  );
  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const NON_EVM_SEND_CONTEXT = {
  asset: SOLANA_ASSET,
  chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  from: MOCK_ADDRESS_3,
  fromAccount: {
    id: 'mock-account-id',
    metadata: { snap: { id: 'npm:@metamask/solana-wallet-snap' } },
  },
  to: MOCK_ADDRESS_4,
  value: '10',
};

const trackedEventNames = () =>
  mockTrackEvent.mock.calls.map(([event]) => event.name);

const trackedEventProperties = (eventName: string) =>
  mockTrackEvent.mock.calls.find(([event]) => event.name === eventName)?.[0]
    .properties;

beforeEach(() => {
  mockUseNavigate.mockClear();
  mockDispatch.mockClear();
  mockTrackEvent.mockClear();
  mockUseLocation.mockReturnValue({ key: 'in-app-entry' });
});

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
    expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('handleBack navigates home when Send was opened directly', () => {
    mockUseLocation.mockReturnValue({ key: 'default' });
    const result = renderHook();

    result.handleBack();

    expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, {
      replace: true,
      state: { fromFreshTab: true },
    });
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
          Promise.resolve({ id: 'tx123' } as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_2);

    expect(mockSubmitEvmTransaction).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith(
        '/confirm-transaction?loader=send',
      );
    });
  });

  it('enables max value mode for the submitted transaction only', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: 10,
      maxValueMode: true,
      updateNonEVMSubmitError: jest.fn(),
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(SendUtils, 'submitEvmTransaction')
      .mockImplementation(() =>
        Promise.resolve(() =>
          Promise.resolve({ id: 'tx123' } as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_2);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        setMaxValueMode({ transactionId: 'tx123', enabled: true }),
      );
    });
  });

  it('does not enable max value mode when the amount is not the max', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: 10,
      updateNonEVMSubmitError: jest.fn(),
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(SendUtils, 'submitEvmTransaction')
      .mockImplementation(() =>
        Promise.resolve(() =>
          Promise.resolve({ id: 'tx123' } as unknown as TransactionMeta),
        ),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_2);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalled();
    });
    expect(mockDispatch).not.toHaveBeenCalledWith(
      setMaxValueMode({ transactionId: 'tx123', enabled: true }),
    );
  });

  it('normalizes trailing dot values before submitting evm transaction', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: EVM_ASSET,
      chainId: '0x5',
      from: MOCK_ADDRESS_1,
      to: MOCK_ADDRESS_2,
      value: '0.',
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

    expect(mockSubmitEvmTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ value: '0' }),
    );
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

  it('normalizes trailing dot values before submitting non-evm transaction', async () => {
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      asset: SOLANA_ASSET,
      from: MOCK_ADDRESS_3,
      to: MOCK_ADDRESS_4,
      value: '0.',
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
      expect(mockSubmitNonEvmTransaction.mock.calls[0][1]).toEqual(
        expect.objectContaining({ amount: '0' }),
      );
    });
  });

  it('handleSubmit handles snap validation errors for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
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
      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    expect(trackedEventNames()).toStrictEqual(['Send Failed']);
    expect(trackedEventProperties('Send Failed')).toMatchObject({
      failure_phase: 'validation',
      error_code: 'InsufficientBalance',
      client: 'extension',
      chain_id_caip: NON_EVM_SEND_CONTEXT.chainId,
      snap_id: 'npm:@metamask/solana-wallet-snap',
    });
  });

  it('records an unknown sentinel rather than undefined when the account has no snap metadata', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
      fromAccount: { id: 'mock-account-id' },
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
    });

    expect(trackedEventProperties('Send Failed')).toMatchObject({
      failure_phase: 'validation',
      error_code: 'InsufficientBalance',
      snap_id: NonEvmSendUnknownValue,
    });
    expect(trackedEventProperties('Send Failed')).not.toHaveProperty(
      'snap_id',
      undefined,
    );
  });

  it('handleSubmit handles valid: false without errors array for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
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
      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    expect(trackedEventNames()).toStrictEqual(['Send Failed']);
    expect(trackedEventProperties('Send Failed')).toMatchObject({
      failure_phase: 'validation',
      error_code: 'unknown',
    });
  });

  it('handleSubmit handles user rejection (code 4001) for non-evm send', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
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
      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    // User rejection is classified, not dropped, so the attempt stays countable
    expect(trackedEventNames()).toStrictEqual(['Send Failed']);
    expect(trackedEventProperties('Send Failed')).toMatchObject({
      failure_phase: 'confirmation',
      error_code: 'user_rejected',
    });
  });

  it('handleSubmit displays generic error for non-rejection snap errors', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.reject(
          Object.assign(new Error('Unexpected snap error'), { code: -32603 }),
        ),
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
      expect(mockUseNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
    });

    expect(trackedEventNames()).toStrictEqual(['Send Failed']);
    expect(trackedEventProperties('Send Failed')).toMatchObject({
      failure_phase: 'snap_rpc',
      error_code: '-32603',
    });
  });

  it('handleSubmit does not emit a client submit/complete event on success', async () => {
    const mockUpdateNonEVMSubmitError = jest.fn();
    jest.spyOn(SendContext, 'useSendContext').mockReturnValue({
      ...NON_EVM_SEND_CONTEXT,
      updateNonEVMSubmitError: mockUpdateNonEVMSubmitError,
    } as unknown as SendContext.SendContextType);

    jest
      .spyOn(MultichainTransactionUtils, 'sendMultichainTransactionForReview')
      .mockImplementation(() =>
        Promise.resolve({ valid: true, transactionId: '0xdeadbeef' }),
      );

    const result = renderHook();
    result.handleSubmit(MOCK_ADDRESS_4);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith('/?tab=activity');
    });

    // The Snap emits the post-submit lifecycle events itself, so the client
    // does not track a duplicate submit/complete event on success.
    expect(trackedEventNames()).toStrictEqual([]);
  });
});
