import React from 'react';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  selectEvmTransactionsForToast,
  selectNonEvmTransactionsForToast,
} from '../../selectors/toast';
import { selectBridgeHistoryForToast } from '../../ducks/bridge-status/selectors';
import { ToastListener } from './toast-listener';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));

jest.mock('react-hot-toast', () => ({
  toast: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
  },
}));

jest.mock('../../selectors', () => ({
  selectEvmTransactionsForToast: jest.fn(),
  selectNonEvmTransactionsForToast: jest.fn(),
}));

jest.mock('../../ducks/bridge-status/selectors', () => ({
  selectBridgeHistoryForToast: jest.fn(),
}));

jest.mock('../../components/ui/toast/toast', () => ({
  ToastContent: () => null,
}));

const mockUseSelector = jest.mocked(useSelector);

type TestState = {
  evmTxs: object[];
  nonEvmTxs: object[];
  bridgeHistory: Record<string, BridgeHistoryItem>;
};

let state: TestState;

const makeBridgeItem = (status: string) =>
  ({
    quote: { srcChainId: 1, destChainId: 137 },
    status: { status },
    account: '0x123',
  }) as unknown as BridgeHistoryItem;

beforeEach(() => {
  jest.clearAllMocks();
  state = {
    evmTxs: [],
    nonEvmTxs: [],
    bridgeHistory: {},
  };
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === selectEvmTransactionsForToast) {
      return state.evmTxs;
    }
    if (selector === selectNonEvmTransactionsForToast) {
      return state.nonEvmTxs;
    }
    if (selector === selectBridgeHistoryForToast) {
      return state.bridgeHistory;
    }
    return undefined;
  });
});

describe('ToastListener', () => {
  describe('EVM transactions', () => {
    it('shows a loading toast when a pending tx appears', () => {
      const { rerender } = render(<ToastListener />);

      state.evmTxs = [{ id: 'tx1', status: 'submitted' }];
      rerender(<ToastListener />);

      expect(toast.loading).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'tx-tx1' }),
      );
    });

    it('shows a success toast when a tx becomes confirmed', () => {
      state.evmTxs = [{ id: 'tx1', status: 'submitted' }];
      const { rerender } = render(<ToastListener />);

      state.evmTxs = [{ id: 'tx1', status: 'confirmed' }];
      rerender(<ToastListener />);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'tx-tx1' }),
      );
    });

    it('shows an error toast when a tx becomes failed', () => {
      state.evmTxs = [{ id: 'tx1', status: 'submitted' }];
      const { rerender } = render(<ToastListener />);

      state.evmTxs = [{ id: 'tx1', status: 'failed' }];
      rerender(<ToastListener />);

      expect(toast.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'tx-tx1' }),
      );
    });
  });

  describe('non-EVM transactions', () => {
    it('shows a success toast when a non-EVM tx becomes confirmed', () => {
      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'submitted' }];
      const { rerender } = render(<ToastListener />);

      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'confirmed' }];
      rerender(<ToastListener />);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'non-evm-tx-sol-tx1' }),
      );
    });

    it('shows an error toast when a non-EVM tx becomes failed', () => {
      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'submitted' }];
      const { rerender } = render(<ToastListener />);

      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'failed' }];
      rerender(<ToastListener />);

      expect(toast.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'non-evm-tx-sol-tx1' }),
      );
    });
  });

  describe('bridge history', () => {
    it('shows a loading toast when a new pending bridge tx appears', () => {
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem('PENDING') };
      rerender(<ToastListener />);

      expect(toast.loading).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });

    it('shows a success toast when a bridge tx becomes complete', () => {
      state.bridgeHistory = { 'bridge-1': makeBridgeItem('PENDING') };
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem('COMPLETE') };
      rerender(<ToastListener />);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });

    it('shows an error toast when a bridge tx becomes failed', () => {
      state.bridgeHistory = { 'bridge-1': makeBridgeItem('PENDING') };
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem('FAILED') };
      rerender(<ToastListener />);

      expect(toast.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });
  });
});
