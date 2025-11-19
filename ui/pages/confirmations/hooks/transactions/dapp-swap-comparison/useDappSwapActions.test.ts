import { act } from '@testing-library/react';
import { QuoteResponse } from '@metamask/bridge-controller';

import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import {
  mockBridgeQuotes,
  mockSwapConfirmation,
} from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { deleteDappSwapComparisonData } from '../../../../../store/actions';
import { Confirmation } from '../../../types/confirm';
import * as ConfirmContext from '../../../context/confirm';
import { useDappSwapActions } from './useDappSwapActions';

jest.mock('../../../../../store/actions', () => ({
  deleteDappSwapComparisonData: jest.fn(),
}));

const mockCaptureSwapSubmit = jest.fn();
jest.mock('./useDappSwapComparisonMetrics', () => ({
  useDappSwapComparisonMetrics: () => ({
    captureSwapSubmit: mockCaptureSwapSubmit,
  }),
}));

async function runHook(mockConfirmation?: Confirmation) {
  const response = renderHookWithConfirmContextProvider(
    useDappSwapActions,
    getMockConfirmStateForTransaction(
      mockConfirmation ?? (mockSwapConfirmation as Confirmation),
    ),
  );

  await act(async () => {
    // Ignore
  });

  return response.result.current;
}

describe('useDappSwapActions', () => {
  describe('updateSwapWithQuoteDetails', () => {
    it('updates transactionMeta with MM quote if available', async () => {
      jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
        quoteSelectedForMMSwap: mockBridgeQuotes[0] as unknown as QuoteResponse,
        currentConfirmation: mockSwapConfirmation,
        isQuotedSwapDisplayedInInfo: true,
      } as ReturnType<typeof ConfirmContext.useConfirmContext>);

      const mockTransactionMeta = { txParams: {} };
      const { updateSwapWithQuoteDetails } = await runHook();
      updateSwapWithQuoteDetails(mockTransactionMeta);

      expect(mockTransactionMeta).toStrictEqual(
        expect.objectContaining({
          batchTransactions: [
            {
              data: '',
              gas: '0xf67f',
              isAfter: false,
              maxFeePerGas: undefined,
              maxPriorityFeePerGas: undefined,
              to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
              type: 'swapApproval',
              value: '0x0',
            },
          ],
          batchTransactionsOptions: {},
          nestedTransactions: undefined,
          txParams: {
            data: '',
            gas: '0x619f7',
            to: '0x9dDA6Ef3D919c9bC8885D5560999A3640431e8e6',
            value: '0x0',
          },
        }),
      );
    });
  });

  describe('onDappSwapCompleted', () => {
    it('should delete the dapp swap comparison data and capture the swap submit', async () => {
      jest.spyOn(ConfirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: mockSwapConfirmation,
        quoteSelectedForMMSwap: {} as QuoteResponse,
      } as unknown as ReturnType<typeof ConfirmContext.useConfirmContext>);

      const { onDappSwapCompleted } = await runHook();
      onDappSwapCompleted();

      expect(deleteDappSwapComparisonData).toHaveBeenCalledWith(
        'f8172040-b3d0-11f0-a882-3f99aa2e9f0c',
      );
      expect(mockCaptureSwapSubmit).toHaveBeenCalled();
    });
  });
});
