import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedContractInteractionConfirmation,
} from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useGasFeeEstimates } from '../../../../../../hooks/useGasFeeEstimates';
import { useTransactionGasFeeEstimate } from './useTransactionGasFeeEstimate';

jest.mock('../../../../../../hooks/useGasFeeEstimates', () => ({
  useGasFeeEstimates: jest.fn(),
}));

describe('useTransactionGasFeeEstimate', () => {
  const mockUseGasFeeEstimates = jest.mocked(useGasFeeEstimates);

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGasFeeEstimates.mockReturnValue({
      gasFeeEstimates: {
        estimatedBaseFee: '0.5', // 0.5 GWEI
      },
    } as unknown as ReturnType<typeof useGasFeeEstimates>);
  });

  it('correctly calculates gas estimate using estimatedBaseFee for EIP1559', () => {
    const transactionMeta = {
      ...genUnapprovedContractInteractionConfirmation({
        address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      }),
      txParams: {
        gas: '0x5208', // 21000 in hex
        maxPriorityFeePerGas: '0x3b9aca00', // 1 GWEI in hex
        maxFeePerGas: '0x77359400', // 2 GWEI in hex
      },
    } as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useTransactionGasFeeEstimate(transactionMeta, true),
      mockState,
    );

    // 21000 * (0.5 + 1) = 21000 * 1.5 = 31500
    // 31500 in hex is 1ca62a4f7800
    expect(result.current).toBe('1ca62a4f7800');
  });

  it('returns the correct estimate when EIP1559 is not supported', () => {
    const transactionMeta = genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;
    const supportsEIP1559 = false;

    const { result } = renderHookWithProvider(
      () => useTransactionGasFeeEstimate(transactionMeta, supportsEIP1559),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`"0"`);
  });

  it('returns the correct estimate when quotedGasLimit is provided', () => {
    const transactionMeta = {
      ...genUnapprovedContractInteractionConfirmation({
        address: CONTRACT_INTERACTION_SENDER_ADDRESS,
      }),
      txParams: {
        gas: '0x5208', // 21000 in hex
        maxPriorityFeePerGas: '0x3b9aca00', // 1 GWEI in hex
        maxFeePerGas: '0x77359400', // 2 GWEI in hex
      },
    } as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useTransactionGasFeeEstimate(transactionMeta, true, '0x61077a1f'),
      mockState,
    );

    expect(result.current).toMatchInlineSnapshot(`"21e3164ec303b100"`);
  });
});
