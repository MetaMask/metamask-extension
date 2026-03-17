import { TransactionMeta } from '@metamask/transaction-controller';
import { CaipChainId, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { sumHexes } from '../../../../shared/lib/conversion.utils';
import {
  getMultichainNetworkConfigurationsByChainId,
  selectTransactionAvailableBalance,
} from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { isBalanceSufficient } from '../send-utils/send.utils';
import { useFeeCalculations } from '../components/confirm/info/hooks/useFeeCalculations';

const ZERO_HEX_FALLBACK = '0x0';

export function useHasInsufficientBalance(): {
  hasInsufficientBalance: boolean;
  nativeCurrency?: string;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: transactionId,
    chainId,
    txParams: { value = ZERO_HEX_FALLBACK } = {},
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const balance = (useSelector((state) =>
    selectTransactionAvailableBalance(state, transactionId, chainId),
  ) ?? ZERO_HEX_FALLBACK) as Hex;

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const { maxFeeHex } = useFeeCalculations(currentConfirmation);

  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const nativeCurrency = (
    multichainNetworks[chainId as CaipChainId] ?? evmNetworks[chainId]
  )?.nativeCurrency;

  const insufficientBalance = !isBalanceSufficient({
    amount: totalValue,
    gasTotal: maxFeeHex,
    balance,
  });

  return { hasInsufficientBalance: insufficientBalance, nativeCurrency };
}
