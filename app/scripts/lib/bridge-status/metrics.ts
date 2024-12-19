/* eslint-disable camelcase */
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
import {
  BridgeStatusControllerBridgeTransactionCompleteEvent,
  BridgeStatusControllerBridgeTransactionFailedEvent,
} from '../../controllers/bridge-status/types';
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
import { BridgeHistoryItem } from '../../../../shared/types/bridge-status';
import {
  BackgroundState,
  getHexGasTotalUsd,
  getTokenUsdValue,
} from './metrics-utils';

type TrackEvent = (
  payload: MetaMetricsEventPayload,
  options?: MetaMetricsEventOptions,
) => void;

const getCommonProperties = (
  bridgeHistoryItem: BridgeHistoryItem,
  state: BackgroundState,
) => {
  const keyring = getCurrentKeyring(state);
  // @ts-expect-error keyring type is possibly wrong
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  const chain_id_source = decimalToPrefixedHex(
    bridgeHistoryItem.quote.srcChainId,
  );
  const chain_id_destination = decimalToPrefixedHex(
    bridgeHistoryItem.quote.destChainId,
  );

  const usd_actual_gas = getHexGasTotalUsd({ bridgeHistoryItem, state }) ?? 0;
  const usd_quoted_return = Number(
    bridgeHistoryItem.pricingData?.quotedReturnInUsd,
  );
  const usd_quoted_gas = Number(bridgeHistoryItem.pricingData?.quotedGasInUsd);

  const isBridgeTx =
    bridgeHistoryItem.quote.srcChainId !== bridgeHistoryItem.quote.destChainId;

  return {
    action_type: ActionType.CROSSCHAIN_V1,

    slippage_limit: bridgeHistoryItem.slippagePercentage,
    custom_slippage:
      bridgeHistoryItem.slippagePercentage !== BRIDGE_DEFAULT_SLIPPAGE,

    chain_id_source,
    chain_id_destination,

    token_address_source: bridgeHistoryItem.quote.srcAsset.address,
    token_address_destination: bridgeHistoryItem.quote.destAsset.address,

    token_symbol_source: bridgeHistoryItem.quote.srcAsset.symbol,
    token_symbol_destination: bridgeHistoryItem.quote.destAsset.symbol,

    stx_enabled: getIsSmartTransaction(state),
    is_hardware_wallet,

    provider: formatProviderLabel(bridgeHistoryItem.quote),

    quoted_time_minutes: bridgeHistoryItem.estimatedProcessingTimeInSeconds
      ? bridgeHistoryItem.estimatedProcessingTimeInSeconds / 60
      : 0,
    actual_time_minutes:
      bridgeHistoryItem.completionTime && bridgeHistoryItem.startTime
        ? (bridgeHistoryItem.completionTime - bridgeHistoryItem.startTime) /
          1000 /
          60
        : 0,

    swap_type: isBridgeTx ? ActionType.CROSSCHAIN_V1 : ActionType.SWAPBRIDGE_V1,

    usd_amount_source: Number(bridgeHistoryItem.pricingData?.amountSentInUsd),

    usd_actual_gas,
    usd_quoted_return,
    usd_quoted_gas,

    gas_included: false, // TODO check if trade has gas included
  };
};

export const handleBridgeTransactionComplete = async (
  payload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  {
    state,
    trackEvent,
  }: {
    state: BackgroundState;
    trackEvent: TrackEvent;
  },
) => {
  const { bridgeHistoryItem } = payload;

  const common = getCommonProperties(bridgeHistoryItem, state);
  const {
    chain_id_destination,
    usd_actual_gas,
    usd_quoted_return,
    usd_quoted_gas,
  } = common;

  // Get received dest token usd price
  const destTokenAmountAtomic =
    bridgeHistoryItem.status.destChain?.amount ?? '0';
  const destTokenAmount = calcTokenAmount(
    destTokenAmountAtomic,
    bridgeHistoryItem.quote.destAsset.decimals,
  ).toNumber();
  const destTokenUsdValue =
    (await getTokenUsdValue({
      chainId: chain_id_destination,
      tokenAmount: destTokenAmount,
      tokenAddress: bridgeHistoryItem.quote.destAsset.address,
      state,
    })) ?? 0;

  const quote_vs_execution_ratio =
    usd_quoted_return && destTokenUsdValue
      ? usd_quoted_return / destTokenUsdValue
      : 0;

  const quoted_vs_used_gas_ratio =
    usd_quoted_gas && usd_actual_gas ? usd_quoted_gas / usd_actual_gas : 0;

  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionCompleted] & {
    action_type: ActionType;
  } = {
    ...common,
    usd_actual_return: destTokenUsdValue,
    quote_vs_execution_ratio,
    quoted_vs_used_gas_ratio,
  };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionCompleted,
    properties,
  });
};

export const handleBridgeTransactionFailed = async (
  payload: BridgeStatusControllerBridgeTransactionFailedEvent['payload'][0],
  {
    state,
    trackEvent,
  }: {
    state: BackgroundState;
    trackEvent: TrackEvent;
  },
) => {
  const { bridgeHistoryItem } = payload;
  const common = getCommonProperties(bridgeHistoryItem, state);
  const properties: CrossChainSwapsEventProperties[MetaMetricsEventName.ActionFailed] =
    {
      ...common,
    };

  trackEvent({
    category: MetaMetricsEventCategory.CrossChainSwaps,
    event: MetaMetricsEventName.ActionFailed,
    properties,
  });
};
