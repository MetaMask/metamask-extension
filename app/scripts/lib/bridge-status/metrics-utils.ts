import { Hex } from '@metamask/utils';
import { TransactionControllerState } from '@metamask/transaction-controller';
import { calcHexGasTotal } from '../../../../shared/lib/transaction-breakdown-utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { BridgeHistoryItem } from '../../../../shared/types/bridge-status';
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
import { SmartTransactionsMetaMaskState } from '../../../../shared/modules/selectors';
import { NetworkState } from '../../../../shared/modules/selectors/networks';

export const getHexGasTotalUsd = ({
  bridgeHistoryItem,
  state,
}: {
  bridgeHistoryItem: BridgeHistoryItem;
  state: BackgroundState;
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
export const getTokenUsdValue = async ({
  chainId,
  tokenAmount,
  tokenAddress,
  state,
}: {
  chainId: Hex;
  tokenAmount: number;
  tokenAddress: string;
  state: BackgroundState;
}) => {
  const marketData = getMarketData(state);
  const tokenToNativeAssetRate = exchangeRateFromMarketData(
    chainId,
    tokenAddress,
    marketData,
  );
  if (tokenToNativeAssetRate) {
    const nativeToUsdRate = getUSDConversionRateByChainId(chainId)(state);
    return tokenAmount * tokenToNativeAssetRate * nativeToUsdRate;
  }

  const tokenToUsdRate = await getTokenExchangeRate({
    chainId,
    tokenAddress,
    currency: 'usd',
  });
  if (!tokenToUsdRate) {
    return null;
  }
  return tokenAmount * tokenToUsdRate;
};
export type BackgroundState = SmartTransactionsMetaMaskState &
  NetworkState & { metamask: TransactionControllerState };
