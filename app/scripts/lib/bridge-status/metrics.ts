import { BRIDGE_DEFAULT_SLIPPAGE } from '../../../../shared/constants/bridge';
import { getConvertedUsdAmounts } from '../../../../shared/lib/bridge/metrics';
import { Numeric } from '../../../../shared/modules/Numeric';
import {
  getIsSmartTransaction,
  SmartTransactionsMetaMaskState,
} from '../../../../shared/modules/selectors';
import { NetworkState } from '../../../../shared/modules/selectors/networks';
import { ActionType } from '../../../../ui/hooks/bridge/events/types';
import { formatProviderLabel } from '../../../../ui/pages/bridge/utils/quote';
import { getCurrentKeyring, getMarketData } from '../../../../ui/selectors';
import { BridgeStatusControllerBridgeTransactionCompleteEvent } from '../../controllers/bridge-status/types';

export const handleBridgeTransactionComplete = async (
  bridgeTransactionCompletePayload: BridgeStatusControllerBridgeTransactionCompleteEvent['payload'][0],
  state: SmartTransactionsMetaMaskState & NetworkState, // make this look like the ui redux state so we can reuse selectors
) => {
  console.log('handleBridgeTransactionComplete', {
    bridgeTransactionCompletePayload,
    state,
  });

  const { bridgeHistoryItem } = bridgeTransactionCompletePayload;

  const keyring = getCurrentKeyring(state);
  // @ts-expect-error keyring type is possibly wrong
  const is_hardware_wallet = isHardwareKeyring(keyring.type) ?? false;

  const isBridgeTx =
    bridgeHistoryItem.quote.srcChainId !== bridgeHistoryItem.quote.destChainId;

  const destChainAmount = bridgeHistoryItem.status.destChain?.amount;
  const marketData = getMarketData(state);

  const properties = {
    action_type: ActionType.CROSSCHAIN_V1,
    slippage_limit: bridgeHistoryItem.slippagePercentage,
    custom_slippage:
      bridgeHistoryItem.slippagePercentage !== BRIDGE_DEFAULT_SLIPPAGE,
    chain_id_source: new Numeric(
      bridgeHistoryItem.quote.srcChainId,
      10,
    ).toPrefixedHexString(),
    chain_id_destination: new Numeric(
      bridgeHistoryItem.quote.destChainId,
      10,
    ).toPrefixedHexString(),
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
        : 0, // TODO make this more accurate by looking up dest txHash block time
    swap_type: isBridgeTx ? ActionType.CROSSCHAIN_V1 : ActionType.SWAPBRIDGE_V1,
    usd_amount_source: bridgeHistoryItem.pricingData?.amountSentInUsd,
    usd_quoted_return: bridgeHistoryItem.pricingData?.quotedReturnInUsd,
    usd_quoted_gas: bridgeHistoryItem.pricingData?.quotedGasInUsd,
  };

  console.log('properties', properties);

  // DONE
  // action_type: crosschain-v1
  // slippage_limit: number
  // custom_slippage: boolean
  // chain_id_source:
  // chain_id_destination:
  // token_symbol_source:
  // token_symbol_destination:
  // stx_enabled: boolean
  // is_hardware_wallet: boolean
  // provider:
  // quoted_time_minutes:
  // swap_type: crosschain or single chain
  // actual_time_minutes:
  // usd_amount_source:
  // usd_quoted_return:
  // usd_quoted_gas:

  // TODO
  // usd_actual_return:
  // usd_actual_gas:
  // quote_vs_execution_ratio
  // quoted_vs_used_gas_ratio
  // gas_included: boolean
};
