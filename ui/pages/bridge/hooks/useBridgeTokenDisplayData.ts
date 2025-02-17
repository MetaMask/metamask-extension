import { useSelector } from 'react-redux';
import { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import { BridgeHistoryItem } from '../../../../shared/types/bridge-status';

/**
 * A Bridge transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 *
 * @param transactionGroup - A Bridge transaction group
 */
export function useBridgeTokenDisplayData(transactionGroup: TransactionGroup) {
  const { primaryTransaction } = transactionGroup;
  const chainId = useSelector(getCurrentChainId);
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  const bridgeHistoryItem: BridgeHistoryItem | undefined =
    bridgeHistory[primaryTransaction.id];

  // Display currency can be fiat or a token
  const displayCurrencyAmount = useTokenFiatAmount(
    primaryTransaction.sourceTokenAddress,
    bridgeHistoryItem?.pricingData?.amountSent,
    primaryTransaction.sourceTokenSymbol,
    {},
    true,
    chainId,
  );

  return {
    category: TransactionGroupCategory.bridge,
    displayCurrencyAmount,
    sourceTokenSymbol: primaryTransaction.sourceTokenSymbol,
    sourceTokenAmountSent: bridgeHistoryItem?.pricingData?.amountSent,
  };
}
