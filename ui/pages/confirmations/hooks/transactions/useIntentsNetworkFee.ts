import { QuoteResponse } from '@metamask/bridge-controller';
import { useAsyncResult } from '../../../../hooks/useAsync';
import { toHex } from '@metamask/controller-utils';
import { estimateGasFee } from '../../../../store/actions';
import {
  FeeMarketGasFeeEstimates,
  GasFeeEstimateLevel,
} from '@metamask/transaction-controller';
import { add0x } from '@metamask/utils';
import BigNumber from 'bignumber.js';

export function useIntentsNetworkFee(intentQuote?: QuoteResponse | null) {
  const chainId = toHex(intentQuote?.quote?.srcChainId ?? '0x1');
  const trade = intentQuote?.trade;

  const { pending: loading, value: gasFee } = useAsyncResult(async () => {
    if (!trade) {
      return undefined;
    }

    return estimateGasFee({
      transactionParams: trade,
      chainId,
    });
  }, [chainId, trade]);

  const tradeMediumFee =
    (gasFee?.estimates as FeeMarketGasFeeEstimates)?.[
      GasFeeEstimateLevel.Medium
    ]?.maxFeePerGas ?? '0x0';

  const tradeGasLimit = intentQuote?.trade.gasLimit ?? 0;
  const approvalGasLimit = intentQuote?.approval?.gasLimit ?? 0;
  const totalGasLimit = tradeGasLimit + approvalGasLimit;

  const totalCostNative = add0x(
    new BigNumber(totalGasLimit).mul(tradeMediumFee, 16).toString(16),
  );

  const value = intentQuote ? totalCostNative : undefined;

  return {
    loading,
    value,
  };
}
