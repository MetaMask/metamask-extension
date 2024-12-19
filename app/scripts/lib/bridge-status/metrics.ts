import { BRIDGE_DEFAULT_SLIPPAGE } from '../../../../shared/constants/bridge';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ActionType } from '../../../../ui/hooks/bridge/events/types';
// eslint-disable-next-line import/no-restricted-paths
import { formatProviderLabel } from '../../../../ui/pages/bridge/utils/quote';
import {
  getCurrentKeyring,
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../ui/selectors';
import { BridgeStatusControllerBridgeTransactionCompleteEvent } from '../../controllers/bridge-status/types';
import { decimalToPrefixedHex } from '../../../../shared/modules/conversion.utils';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
// eslint-disable-next-line import/no-restricted-paths
import { isHardwareKeyring } from '../../../../ui/helpers/utils/hardware';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventOptions,
  MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
// eslint-disable-next-line import/no-restricted-paths
import { CrossChainSwapsEventProperties } from '../../../../ui/hooks/bridge/useCrossChainSwapsEventTracker';
import {
  BackgroundState,
  getHexGasTotalUsd,
  getTokenUsdValue,
} from './metrics-utils';

export const handleBridgeTransactionComplete = async (
  payload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  {
    state,
    trackEvent,
  }: {
    state: BackgroundState;
    trackEvent: (
      payload: MetaMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ) => void;
  },
) => {
  const { bridgeHistoryItem } = payload;

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
  const destTokenUsdValue =
    (await getTokenUsdValue({
      chainId: destChainIdHex,
      tokenAmount: destTokenAmount,
      tokenAddress: bridgeHistoryItem.quote.destAsset.address,
      state,
    })) ?? 0;

  // Get gas total in usd
  const gasTotalUsd = getHexGasTotalUsd({ bridgeHistoryItem, state }) ?? 0;

  const srcChainIdHex = decimalToPrefixedHex(
    bridgeHistoryItem.quote.srcChainId,
  );

  const quotedReturnInUsd = Number(
    bridgeHistoryItem.pricingData?.quotedReturnInUsd,
  );
  const quotedGasInUsd = Number(bridgeHistoryItem.pricingData?.quotedGasInUsd);

  const quoteVsExecutionRatio =
    quotedReturnInUsd && destTokenUsdValue
      ? quotedReturnInUsd / destTokenUsdValue
      : 0;

  const quotedVsUsedGasRatio =
    quotedGasInUsd && gasTotalUsd ? quotedGasInUsd / gasTotalUsd : 0;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionCompleted] & {
    action_type: ActionType.CROSSCHAIN_V1;
  } = {
    action_type: ActionType.CROSSCHAIN_V1,
    slippage_limit: bridgeHistoryItem.slippagePercentage,
    custom_slippage:
      bridgeHistoryItem.slippagePercentage !== BRIDGE_DEFAULT_SLIPPAGE,
    chain_id_source: srcChainIdHex,
    chain_id_destination: destChainIdHex,
    token_address_source: bridgeHistoryItem.quote.srcAsset.address,
    token_address_destination: bridgeHistoryItem.quote.destAsset.address,
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
    usd_amount_source: Number(bridgeHistoryItem.pricingData?.amountSentInUsd),
    usd_quoted_return: quotedReturnInUsd,
    usd_quoted_gas: quotedGasInUsd,
    usd_actual_return: destTokenUsdValue,
    usd_actual_gas: gasTotalUsd,
    quote_vs_execution_ratio: quoteVsExecutionRatio,
    quoted_vs_used_gas_ratio: quotedVsUsedGasRatio,
    gas_included: false, // TODO check if trade has gas included
  };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionCompleted,
    properties,
  });
};
