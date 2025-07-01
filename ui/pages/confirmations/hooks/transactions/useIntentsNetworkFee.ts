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
import { useTokenFiatAmount } from '../../../../hooks/useTokenFiatAmount';
import { NATIVE_TOKEN_ADDRESS } from '../../../../helpers/constants/intents';

export function useIntentsNetworkFee(quotes?: (QuoteResponse | undefined)[]) {
  const { pending: loading, value: gasFee } = useAsyncResult(async () => {
    if (!quotes?.length) {
      return undefined;
    }

    return estimateGasFee({
      transactionParams: quotes[0]?.trade,
      chainId: toHex(quotes[0]?.trade.chainId ?? '0x0'),
    });
  }, [JSON.stringify(quotes)]);

  const tradeMediumFee =
    (gasFee?.estimates as FeeMarketGasFeeEstimates)?.[
      GasFeeEstimateLevel.Medium
    ]?.maxFeePerGas ?? '0x0';

  const totalGasLimit =
    quotes?.reduce((acc, quote) => {
      const tradeGasLimit = quote?.trade.gasLimit ?? 0;
      const approvalGasLimit = quote?.approval?.gasLimit ?? 0;
      return acc + tradeGasLimit + approvalGasLimit;
    }, 0) ?? 0;

  const networkFee = quotes?.length
    ? new BigNumber(totalGasLimit)
        .mul(tradeMediumFee, 16)
        .shift(-18)
        .round(6)
        .toString()
    : undefined;

  return {
    loading,
    networkFee,
  };
}
