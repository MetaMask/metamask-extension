import React from 'react';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
  selectEvmTransactionsForToast,
  selectNonEvmTransactionsForToast,
} from '../../../selectors';
import {
  selectBridgeHistoryForAccountGroup,
  selectNonEvmBridgeSourceTxIds,
} from '../../../ducks/bridge-status/selectors';
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

jest.mock('../../../selectors', () => ({
  selectEvmTransactionsForToast: jest.fn(),
  selectNonEvmTransactionsForToast: jest.fn(),
}));

jest.mock('../../../ducks/bridge-status/selectors', () => ({
  selectBridgeHistoryForAccountGroup: jest.fn(),
  selectNonEvmBridgeSourceTxIds: jest.fn(),
}));

jest.mock('@metamask/bridge-controller', () => ({
  isNonEvmChainId: jest.fn().mockReturnValue(false),
  StatusTypes: { PENDING: 'PENDING', COMPLETE: 'COMPLETE', FAILED: 'FAILED' },
}));

jest.mock('./toast', () => ({ ToastContent: () => null }));

const mockUseSelector = jest.mocked(useSelector);

type TestState = {
  evmTxs: object[];
  nonEvmTxs: object[];
  bridgeHistory: Record<string, BridgeHistoryItem>;
  nonEvmBridgeIds: Set<string>;
};

let state: TestState;

const makeBridgeItem = (
  srcChainId: number,
  destChainId: number,
  status: string,
  extra: Record<string, unknown> = {},
) =>
  ({
    quote: { srcChainId, destChainId },
    status: { status },
    account: '0x123',
    ...extra,
  }) as unknown as BridgeHistoryItem;

beforeEach(() => {
  jest.clearAllMocks();
  state = {
    evmTxs: [],
    nonEvmTxs: [],
    bridgeHistory: {},
    nonEvmBridgeIds: new Set(),
  };
  mockUseSelector.mockImplementation((selector: unknown) => {
    if (selector === selectEvmTransactionsForToast) {
      return state.evmTxs;
    }
    if (selector === selectNonEvmTransactionsForToast) {
      return state.nonEvmTxs;
    }
    if (selector === selectBridgeHistoryForAccountGroup) {
      return state.bridgeHistory;
    }
    if (selector === selectNonEvmBridgeSourceTxIds) {
      return state.nonEvmBridgeIds;
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

    it('skips bridge approval txs', () => {
      state.bridgeHistory = {
        'order-1': makeBridgeItem(1, 10, 'PENDING', {
          approvalTxId: 'approval-tx',
        }),
      };
      const { rerender } = render(<ToastListener />);

      state.evmTxs = [{ id: 'approval-tx', status: 'submitted' }];
      rerender(<ToastListener />);

      expect(toast.loading).not.toHaveBeenCalled();
    });
  });

  describe('non-EVM transactions', () => {
    it('shows a loading toast when a new pending non-EVM tx appears', () => {
      const { rerender } = render(<ToastListener />);

      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'submitted' }];
      rerender(<ToastListener />);

      expect(toast.loading).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'non-evm-tx-sol-tx1' }),
      );
    });

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

    it('skips non-EVM txs that are tracked by bridge history', () => {
      state.nonEvmBridgeIds = new Set(['sol-tx1']);
      const { rerender } = render(<ToastListener />);

      state.nonEvmTxs = [{ id: 'sol-tx1', status: 'submitted' }];
      rerender(<ToastListener />);

      expect(toast.loading).not.toHaveBeenCalled();
    });
  });

  describe.skip('bridge history', () => {
    it('shows a loading toast when a new pending bridge tx appears', () => {
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem(1, 137, 'PENDING') };
      rerender(<ToastListener />);

      expect(toast.loading).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });

    it('shows a success toast when a bridge tx becomes complete', () => {
      state.bridgeHistory = { 'bridge-1': makeBridgeItem(1, 137, 'PENDING') };
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem(1, 137, 'COMPLETE') };
      rerender(<ToastListener />);

      expect(toast.success).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });

    it('shows an error toast when a bridge tx becomes failed', () => {
      state.bridgeHistory = { 'bridge-1': makeBridgeItem(1, 137, 'PENDING') };
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = { 'bridge-1': makeBridgeItem(1, 137, 'FAILED') };
      rerender(<ToastListener />);

      expect(toast.error).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'bridge-tx-bridge-1' }),
      );
    });

    it('skips EVM same-chain swaps', () => {
      const { rerender } = render(<ToastListener />);

      state.bridgeHistory = {
        'swap-1': makeBridgeItem(1, 1, 'PENDING'), // same chain, isNonEvmChainId=false → skip
      };
      rerender(<ToastListener />);

      expect(toast.loading).not.toHaveBeenCalled();
    });
  });
});
