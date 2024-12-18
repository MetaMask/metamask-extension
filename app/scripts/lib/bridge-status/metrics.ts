import { Hex } from '@metamask/utils';
import { TransactionControllerState } from '@metamask/transaction-controller';
import { BRIDGE_DEFAULT_SLIPPAGE } from '../../../../shared/constants/bridge';
import {
  getIsSmartTransaction,
  SmartTransactionsMetaMaskState,
} from '../../../../shared/modules/selectors';
import { NetworkState } from '../../../../shared/modules/selectors/networks';
import {
  exchangeRateFromMarketData,
  getTokenExchangeRate,
} from '../../../../ui/ducks/bridge/utils';
import { ActionType } from '../../../../ui/hooks/bridge/events/types';
import { formatProviderLabel } from '../../../../ui/pages/bridge/utils/quote';
import {
  getCurrentKeyring,
  getMarketData,
  getUSDConversionRateByChainId,
} from '../../../../ui/selectors';
import { BridgeStatusControllerBridgeTransactionCompleteEvent } from '../../controllers/bridge-status/types';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { calcHexGasTotal } from '../../../../shared/lib/transaction-breakdown-utils';
import { BridgeHistoryItem } from '../../../../shared/types/bridge-status';

type BackgroundState = SmartTransactionsMetaMaskState &
  NetworkState & { metamask: TransactionControllerState };

const getTokenUsdValue = async ({
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

const getHexGasTotalUsd = ({
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

export const handleBridgeTransactionComplete = async (
  bridgeTransactionCompletePayload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  state: BackgroundState,
) => {
  console.log('handleBridgeTransactionComplete', {
    bridgeTransactionCompletePayload,
    state,
  });

  const { bridgeHistoryItem } = bridgeTransactionCompletePayload;

  const keyring = getCurrentKeyring(state);
  // @ts-expect-error keyring type is possibly wrong
  const isHardwareWallet = isHardwareKeyring(keyring.type) ?? false;

  const isBridgeTx =
    bridgeHistoryItem.quote.srcChainId !== bridgeHistoryItem.quote.destChainId;

  // Get dest token usd price
  const destChainIdHex = decimalToPrefixedHex(
    bridgeHistoryItem.quote.destChainId,
  );
  const destTokenAmountAtomic =
    bridgeHistoryItem.status.destChain?.amount ?? '0';
  const destTokenAmount = calcTokenAmount(
    destTokenAmountAtomic,
    bridgeHistoryItem.quote.destAsset.decimals,
  ).toNumber();
  const destTokenUsdValue = await getTokenUsdValue({
    chainId: destChainIdHex,
    tokenAmount: destTokenAmount,
    tokenAddress: bridgeHistoryItem.quote.destAsset.address,
    state,
  });

  // Get gas total in usd
  const gasTotalUsd = getHexGasTotalUsd({ bridgeHistoryItem, state });

  const srcChainIdHex = decimalToPrefixedHex(
    bridgeHistoryItem.quote.srcChainId,
  );

  const quotedReturnInUsd = bridgeHistoryItem.pricingData?.quotedReturnInUsd;
  const quotedGasInUsd = bridgeHistoryItem.pricingData?.quotedGasInUsd;

  const quoteVsExecutionRatio =
    quotedReturnInUsd && quotedGasInUsd
      ? Number(quotedReturnInUsd) / Number(quotedGasInUsd)
      : null;

  const quotedVsUsedGasRatio =
    quotedGasInUsd && gasTotalUsd ? Number(quotedGasInUsd) / gasTotalUsd : null;

  const properties = {
    action_type: ActionType.CROSSCHAIN_V1,
    slippage_limit: bridgeHistoryItem.slippagePercentage,
    custom_slippage:
      bridgeHistoryItem.slippagePercentage !== BRIDGE_DEFAULT_SLIPPAGE,
    chain_id_source: srcChainIdHex,
    chain_id_destination: destChainIdHex,
    token_symbol_source: bridgeHistoryItem.quote.srcAsset.symbol,
    token_symbol_destination: bridgeHistoryItem.quote.destAsset.symbol,
    stx_enabled: getIsSmartTransaction(state),
    is_hardware_wallet: isHardwareWallet,
    provider: formatProviderLabel(bridgeHistoryItem.quote),
    quoted_time_minutes: bridgeHistoryItem.estimatedProcessingTimeInSeconds
      ? bridgeHistoryItem.estimatedProcessingTimeInSeconds / 60
      : 0,
    actual_time_minutes:
      bridgeHistoryItem.completionTime && bridgeHistoryItem.startTime
        ? (bridgeHistoryItem.completionTime - bridgeHistoryItem.startTime) /
          1000 /
          60
        : 0, // TODO make this more accurate by looking up dest txHash block time
    swap_type: isBridgeTx ? ActionType.CROSSCHAIN_V1 : ActionType.SWAPBRIDGE_V1,
    usd_amount_source: bridgeHistoryItem.pricingData?.amountSentInUsd,
    usd_quoted_return: quotedReturnInUsd,
    usd_quoted_gas: quotedGasInUsd,
    usd_actual_return: destTokenUsdValue,
    usd_actual_gas: gasTotalUsd,
    quote_vs_execution_ratio: quoteVsExecutionRatio,
    quoted_vs_used_gas_ratio: quotedVsUsedGasRatio,
    gas_included: false, // TODO check if trade has gas included
  };

  console.log('properties', properties);
};
