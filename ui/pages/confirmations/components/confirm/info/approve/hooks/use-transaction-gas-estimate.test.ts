import { TransactionMeta } from '@metamask/transaction-controller';
import {
  CONTRACT_INTERACTION_SENDER_ADDRESS,
  genUnapprovedApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../../test/lib/render-helpers';
import { estimateGas } from '../../../../../../../store/actions';
import { useTransactionGasEstimate } from './use-transaction-gas-estimate';

jest.mock('../../../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../../../store/actions'),
  estimateGas: jest.fn(),
}));

describe('useTransactionGasEstimate', () => {
  it('passes down the gas estimate to the component', async () => {
    const mockGasEstimate = 100000;
    const estimateGasMock = jest.fn().mockImplementation(() => mockGasEstimate);

    (estimateGas as jest.Mock).mockImplementation(estimateGasMock);

    const transactionMeta = genUnapprovedApproveConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS,
    }) as TransactionMeta;
    const customData = '0x0';
    const customSpendingCap = '10';

    const { result, waitForNextUpdate } = renderHookWithProvider(
      () =>
        useTransactionGasEstimate(
          transactionMeta,
          customData,
          customSpendingCap,
        ),
      mockState,
    );

    await waitForNextUpdate();

    expect(result.current.estimatedGasLimit).toEqual(mockGasEstimate);
  });
});
