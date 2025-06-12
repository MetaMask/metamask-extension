/* eslint-disable import/no-restricted-paths, camelcase */
import {
  formatChainIdToCaip,
  BRIDGE_DEFAULT_SLIPPAGE,
} from '@metamask/bridge-controller';
import { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { getHexGasTotalUsd } from '../../../app/scripts/lib/bridge-status/metrics-utils';
import { MetricsBackgroundState } from '../../types/bridge-status';
import { isHardwareKeyring } from '../../../ui/helpers/utils/hardware';
import { ActionType } from '../../../ui/hooks/bridge/events/types';
import { formatProviderLabel } from '../../../ui/pages/bridge/utils/quote';
import { getCurrentKeyring } from '../../../ui/selectors';
import { getIsSmartTransaction } from '../../modules/selectors';

export const getCommonProperties = (
  bridgeHistoryItem: BridgeHistoryItem,
  state: { metamask: MetricsBackgroundState },
) => {
  const keyring = getCurrentKeyring(state);
  // @ts-expect-error keyring type is possibly wrong
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  const chain_id_source = formatChainIdToCaip(
    bridgeHistoryItem.quote.srcChainId,
  );
  const chain_id_destination = formatChainIdToCaip(
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

    stx_enabled: getIsSmartTransaction(state, chain_id_source),
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
