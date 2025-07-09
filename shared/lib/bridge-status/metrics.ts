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
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const chain_id_source = formatChainIdToCaip(
    bridgeHistoryItem.quote.srcChainId,
  );
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const chain_id_destination = formatChainIdToCaip(
    bridgeHistoryItem.quote.destChainId,
  );

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const usd_actual_gas = getHexGasTotalUsd({ bridgeHistoryItem, state }) ?? 0;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const usd_quoted_return = Number(
    bridgeHistoryItem.pricingData?.quotedReturnInUsd,
  );
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const usd_quoted_gas = Number(bridgeHistoryItem.pricingData?.quotedGasInUsd);

  const isBridgeTx =
    bridgeHistoryItem.quote.srcChainId !== bridgeHistoryItem.quote.destChainId;

  return {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    action_type: ActionType.CROSSCHAIN_V1,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    slippage_limit: bridgeHistoryItem.slippagePercentage,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    custom_slippage:
      bridgeHistoryItem.slippagePercentage !== BRIDGE_DEFAULT_SLIPPAGE,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_source,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_destination,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    token_address_source: bridgeHistoryItem.quote.srcAsset.address,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    token_address_destination: bridgeHistoryItem.quote.destAsset.address,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    token_symbol_source: bridgeHistoryItem.quote.srcAsset.symbol,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    token_symbol_destination: bridgeHistoryItem.quote.destAsset.symbol,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    stx_enabled: getIsSmartTransaction(state, chain_id_source),
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_hardware_wallet,

    provider: formatProviderLabel(bridgeHistoryItem.quote),

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    quoted_time_minutes: bridgeHistoryItem.estimatedProcessingTimeInSeconds
      ? bridgeHistoryItem.estimatedProcessingTimeInSeconds / 60
      : 0,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    actual_time_minutes:
      bridgeHistoryItem.completionTime && bridgeHistoryItem.startTime
        ? (bridgeHistoryItem.completionTime - bridgeHistoryItem.startTime) /
          1000 /
          60
        : 0,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    swap_type: isBridgeTx ? ActionType.CROSSCHAIN_V1 : ActionType.SWAPBRIDGE_V1,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_amount_source: Number(bridgeHistoryItem.pricingData?.amountSentInUsd),

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_actual_gas,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_return,
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    usd_quoted_gas,

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    gas_included: false, // TODO check if trade has gas included
  };
};
