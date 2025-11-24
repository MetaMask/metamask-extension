import { renderHook } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { merge } from 'lodash';

import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import {
  getCrossChainMetaMaskCachedBalances,
  selectMaxValueModeForTransaction,
} from '../../../../../../selectors';
import { useMaxValueRefresher } from './useMaxValueRefresher';
import { useSupportsEIP1559 } from './useSupportsEIP1559';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({ pathname: '/send/asset' }),
  useSearchParams: jest.fn().mockReturnValue([{ get: () => null }]),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: jest
    .fn()
    .mockImplementation((selector: () => void) => selector()),
}));

jest.mock('../../../../../../store/actions', () => ({
  updateEditableParams: jest.fn(),
}));

jest.mock('../../../../../../selectors', () => ({
  getCrossChainMetaMaskCachedBalances: jest.fn(),
  selectMaxValueModeForTransaction: jest.fn(),
}));

jest.mock('../../../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../hooks/useTransactionEventFragment');

jest.mock('./useSupportsEIP1559', () => ({
  useSupportsEIP1559: jest.fn(),
}));

describe('useMaxValueRefresher', () => {
  const useConfirmContextMock = jest.mocked(useConfirmContext);
  const useSupportsEIP1559Mock = jest.mocked(useSupportsEIP1559);
  const updateTransactionEventFragmentMock = jest.fn();
  const useTransactionEventFragmentMock = jest.mocked(
    useTransactionEventFragment,
  );
  const getCrossChainNativeBalancesMock = jest.mocked(
    getCrossChainMetaMaskCachedBalances,
  );
  const selectMaxValueModeForTransactionMock = jest.mocked(
    selectMaxValueModeForTransaction,
  );
  const updateEditableParamsMock = jest.mocked(updateEditableParams);
  const mockUseSearchParams = jest.mocked(useSearchParams);

  const baseTransactionMeta = {
    id: 'test-transaction-id',
    type: TransactionType.simpleSend,
    chainId: '0x1',
    txParams: {
      from: '0x12345',
      gas: '0x5208', // 21000 in hex
      gasPrice: '0x3b9aca00', // 1 gwei in hex
      maxFeePerGas: '0x3b9aca00', // 1 gwei in hex
    },
  };

  const defaultBalance = '0x16345785d8a0000'; // 0.1 ETH in hex

  beforeEach(() => {
    jest.clearAllMocks();

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: baseTransactionMeta,
    } as unknown as ReturnType<typeof useConfirmContext>);

    useSupportsEIP1559Mock.mockReturnValue({
      supportsEIP1559: true,
    });

    getCrossChainNativeBalancesMock.mockReturnValue({
      [baseTransactionMeta.chainId]: {
        [baseTransactionMeta.txParams.from]: defaultBalance,
      },
    });
    selectMaxValueModeForTransactionMock.mockReturnValue(true);

    useTransactionEventFragmentMock.mockReturnValue({
      updateTransactionEventFragment: updateTransactionEventFragmentMock,
    });
  });

  describe('Transaction Event Fragment Updates', () => {
    it('updates transaction event fragment with max amount mode status', () => {
      renderHook(() => useMaxValueRefresher());

      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        {
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_send_max: true,
          },
        },
        baseTransactionMeta.id,
      );
    });

    it('updates transaction event fragment when max amount mode is disabled', () => {
      selectMaxValueModeForTransactionMock.mockReturnValue(false);

      renderHook(() => useMaxValueRefresher());

      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        {
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_send_max: false,
          },
        },
        baseTransactionMeta.id,
      );
    });

    it('updates transaction event fragment when max amount mode changes', () => {
      const { rerender } = renderHook(() => useMaxValueRefresher());

      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        {
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_send_max: true,
          },
        },
        baseTransactionMeta.id,
      );

      selectMaxValueModeForTransactionMock.mockReturnValue(false);
      rerender();

      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        {
          properties: {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_send_max: false,
          },
        },
        baseTransactionMeta.id,
      );
    });
  });

  it('does not update transaction value when max amount mode is disabled', () => {
    selectMaxValueModeForTransactionMock.mockReturnValue(false);

    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });

  it('does not update transaction value for non-simpleSend transactions', () => {
    const contractInteractionMeta = merge({}, baseTransactionMeta, {
      type: TransactionType.contractInteraction,
    });

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: contractInteractionMeta,
    } as unknown as ReturnType<typeof useConfirmContext>);

    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });

  it('does not update transaction value for token transfer transactions', () => {
    const tokenTransferMeta = merge({}, baseTransactionMeta, {
      type: TransactionType.tokenMethodTransfer,
    });

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: tokenTransferMeta,
    } as unknown as ReturnType<typeof useConfirmContext>);

    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).not.toHaveBeenCalled();
  });

  it('updates transaction event fragment with max amount mode status from url params', () => {
    selectMaxValueModeForTransactionMock.mockReturnValue(false);
    mockUseSearchParams.mockReturnValue([
      { get: () => 'true' },
    ] as unknown as ReturnType<typeof useSearchParams>);

    renderHook(() => useMaxValueRefresher());

    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      {
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          is_send_max: true,
        },
      },
      baseTransactionMeta.id,
    );
  });

  describe('Transaction Value Updates - Edge Cases', () => {
    it('does not update when remaining balance is zero', () => {
      // Set balance equal to gas fee (21000 * 1 gwei = 0x4c4b40)
      getCrossChainNativeBalancesMock.mockReturnValue({
        [baseTransactionMeta.chainId]: {
          [baseTransactionMeta.txParams.from]: '0x4c4b40',
        },
      });

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('does not update when remaining balance is negative', () => {
      getCrossChainNativeBalancesMock.mockReturnValue({
        [baseTransactionMeta.chainId]: {
          [baseTransactionMeta.txParams.from]: '0x1000',
        },
      });

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('handles zero balance gracefully', () => {
      getCrossChainNativeBalancesMock.mockReturnValue({
        [baseTransactionMeta.chainId]: {
          [baseTransactionMeta.txParams.from]: '0x0',
        },
      });

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('handles null balance gracefully', () => {
      getCrossChainNativeBalancesMock.mockReturnValue({
        [baseTransactionMeta.chainId]: {
          [baseTransactionMeta.txParams.from]: null,
        },
      });

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });

    it('handles undefined balance gracefully', () => {
      getCrossChainNativeBalancesMock.mockReturnValue({
        [baseTransactionMeta.chainId]: {
          [baseTransactionMeta.txParams.from]: undefined,
        },
      });

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).not.toHaveBeenCalled();
    });
  });

  describe('Gas Fee Calculations', () => {
    describe('EIP-1559 Transactions', () => {
      beforeEach(() => {
        useSupportsEIP1559Mock.mockReturnValue({ supportsEIP1559: true });
      });

      it('calculates value using maxFeePerGas for EIP-1559 transactions', () => {
        const transactionMeta = merge({}, baseTransactionMeta, {
          txParams: {
            gas: '0x5208', // 21000
            maxFeePerGas: '0x77359400', // 2 gwei
          },
        });

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        // Balance: 0.1 ETH (0x16345785d8a0000)
        // Gas fee: 21000 * 2 gwei = 42000 gwei = 0x9c40 gwei = 0x9c4000000000 wei
        // Remaining: 0x16345785d8a0000 - 0x9c4000000000 = 0x1631f457a756000
        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: '0x1631f457a756000',
          },
        );
      });

      it('handles missing maxFeePerGas by using HEX_ZERO', () => {
        const transactionMeta = {
          ...baseTransactionMeta,
          txParams: {
            from: baseTransactionMeta.txParams.from,
            gas: '0x5208',
          },
        };

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        // Gas fee should be 0 when maxFeePerGas is missing
        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: defaultBalance, // Full balance since gas fee is 0
          },
        );
      });
    });

    describe('Legacy Transactions', () => {
      beforeEach(() => {
        useSupportsEIP1559Mock.mockReturnValue({ supportsEIP1559: false });
      });

      it('calculates value using gasPrice for legacy transactions', () => {
        const transactionMeta = merge({}, baseTransactionMeta, {
          txParams: {
            gas: '0x5208', // 21000
            gasPrice: '0x77359400', // 2 gwei
          },
        });

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        // Same calculation as EIP-1559 but using gasPrice
        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: '0x1631f457a756000',
          },
        );
      });

      it('handles missing gasPrice by using HEX_ZERO', () => {
        const transactionMeta = {
          ...baseTransactionMeta,
          txParams: {
            from: baseTransactionMeta.txParams.from,
            gas: '0x5208',
            gasPrice: undefined,
          },
        };

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: defaultBalance,
          },
        );
      });
    });

    describe('Layer 1 Gas Fees (L2 Networks)', () => {
      it('includes layer1GasFee in gas fee calculation', () => {
        const transactionMeta = merge({}, baseTransactionMeta, {
          txParams: {
            gas: '0x5208', // 21000
            maxFeePerGas: '0x3b9aca00', // 1 gwei
          },
          layer1GasFee: '0x2540be400', // 10 gwei
        });

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        // Gas fee: 21000 * 1 gwei + 0x2540be400 wei = 0x4c4b4000000000 + 0x2540be400 = 0x2540c2a40
        // Remaining: 0x16345785d8a0000 - 0x2540c2a40 = 0x163325c97f3cc00
        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: '0x163325c97f3cc00',
          },
        );
      });

      it('handles missing layer1GasFee', () => {
        const transactionMeta = merge({}, baseTransactionMeta, {
          txParams: {
            gas: '0x5208',
            maxFeePerGas: '0x3b9aca00',
          },
        });

        useConfirmContextMock.mockReturnValue({
          currentConfirmation: transactionMeta,
        } as unknown as ReturnType<typeof useConfirmContext>);

        renderHook(() => useMaxValueRefresher());

        // Gas fee: 21000 * 1 gwei = 0x4c4b4000000000 wei
        // Remaining: 0x16345785d8a0000 - 0x4c4b4000000000 = 0x163325eebffb000
        expect(updateEditableParamsMock).toHaveBeenCalledWith(
          transactionMeta.id,
          {
            value: '0x163325eebffb000',
          },
        );
      });
    });

    it('handles missing gas by using HEX_ZERO', () => {
      const transactionMeta = {
        ...baseTransactionMeta,
        txParams: {
          from: baseTransactionMeta.txParams.from,
          maxFeePerGas: '0x3b9aca00',
        },
      };

      useConfirmContextMock.mockReturnValue({
        currentConfirmation: transactionMeta,
      } as unknown as ReturnType<typeof useConfirmContext>);

      renderHook(() => useMaxValueRefresher());

      expect(updateEditableParamsMock).toHaveBeenCalledWith(
        transactionMeta.id,
        {
          value: defaultBalance,
        },
      );
    });
  });

  it('updates value when balance changes', () => {
    const { rerender } = renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);

    getCrossChainNativeBalancesMock.mockReturnValue({
      [baseTransactionMeta.chainId]: {
        [baseTransactionMeta.txParams.from]: '0x2386f26fc10000',
      },
    });
    rerender();

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(2);
    // 0.01 ETH - (21000 * 1 gwei) = 0x2386f26fc10000 - 0x4c4b4000000000 = 0x2373d8fe36b000
    expect(updateEditableParamsMock).toHaveBeenLastCalledWith(
      baseTransactionMeta.id,
      {
        value: '0x2373d8fe36b000',
      },
    );
  });

  it('updates value when gas parameters change', () => {
    const { rerender } = renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);

    const updatedTransactionMeta = {
      ...baseTransactionMeta,
      txParams: {
        from: baseTransactionMeta.txParams.from,
        maxFeePerGas: '0x77359400', // 2 gwei instead of 1
      },
    };

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: updatedTransactionMeta,
    } as unknown as ReturnType<typeof useConfirmContext>);

    rerender();

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(2);
  });

  it('updates value when EIP-1559 support changes', () => {
    const { rerender } = renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);

    useSupportsEIP1559Mock.mockReturnValue({ supportsEIP1559: false });
    rerender();

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(2);
  });

  it('does not update when max amount mode is toggled off', () => {
    const { rerender } = renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);

    selectMaxValueModeForTransactionMock.mockReturnValue(false);
    rerender();

    expect(updateEditableParamsMock).toHaveBeenCalledTimes(1);
  });

  it('dispatches updateEditableParams with correct transaction ID', () => {
    const customTransactionId = 'custom-transaction-123';
    const transactionMeta = merge({}, baseTransactionMeta, {
      id: customTransactionId,
    });

    useConfirmContextMock.mockReturnValue({
      currentConfirmation: transactionMeta,
    } as unknown as ReturnType<typeof useConfirmContext>);

    renderHook(() => useMaxValueRefresher());

    expect(updateEditableParamsMock).toHaveBeenCalledWith(
      customTransactionId,
      expect.any(Object),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      updateEditableParamsMock(customTransactionId, expect.any(Object)),
    );
  });
});
