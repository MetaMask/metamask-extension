import { Hex } from '@metamask/utils';
import { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { calcHexGasTotal } from '../../../../shared/lib/transaction-breakdown-utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { MetricsBackgroundState } from '../../../../shared/types/bridge-status';
import {
  exchangeRateFromMarketData,
  getTokenExchangeRate,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/ducks/bridge/utils';
import {
  getMarketData,
  getUSDConversionRateByChainId,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/selectors';

export const getHexGasTotalUsd = ({
  bridgeHistoryItem,
  state,
}: {
  bridgeHistoryItem: BridgeHistoryItem;
  state: { metamask: MetricsBackgroundState };
}) => {
  const srcTxMeta = state.metamask.transactions.find(
    (txMeta) => txMeta.id === bridgeHistoryItem.txMetaId,
  );

  if (!srcTxMeta) {
    return null;
  }

  const hexGasTotalWei = calcHexGasTotal(srcTxMeta);
  const nativeToUsdRate = getUSDConversionRateByChainId(srcTxMeta.chainId)(
    state,
  );
  return calcTokenAmount(hexGasTotalWei, 18).toNumber() * nativeToUsdRate;
};
