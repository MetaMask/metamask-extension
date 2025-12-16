import { TransactionMeta } from '@metamask/transaction-controller';
import { CaipChainId, Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';

import { sumHexes } from '../../../../shared/modules/conversion.utils';
import {
  getMultichainNetworkConfigurationsByChainId,
  getNativeTokenCachedBalanceByChainIdByAccountAddress,
  selectTransactionFeeById,
} from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { isBalanceSufficient } from '../send-legacy/send.utils';

const ZERO_HEX_FALLBACK = '0x0';

export function useHasInsufficientBalance(): {
  hasInsufficientBalance: boolean;
  nativeCurrency?: string;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: transactionId,
    chainId,
    txParams: { value = ZERO_HEX_FALLBACK, from: fromAddress = '' } = {},
  } = currentConfirmation ?? {};

  const batchTransactionValues =
    currentConfirmation?.nestedTransactions?.map(
      (trxn) => (trxn.value as Hex) ?? ZERO_HEX_FALLBACK,
    ) ?? [];

  const chainBalances = useSelector((state) =>
    getNativeTokenCachedBalanceByChainIdByAccountAddress(
      state,
      fromAddress ?? '',
    ),
  ) as Record<Hex, Hex>;

  const balance = chainBalances?.[chainId as Hex] ?? ZERO_HEX_FALLBACK;

  const totalValue = sumHexes(value, ...batchTransactionValues);

  const { hexMaximumTransactionFee } = useSelector((state) =>
    selectTransactionFeeById(state, transactionId),
  );

  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );

  const nativeCurrency = (
    multichainNetworks[chainId as CaipChainId] ?? evmNetworks[chainId]
  )?.nativeCurrency;

  const insufficientBalance = !isBalanceSufficient({
    amount: totalValue,
    gasTotal: hexMaximumTransactionFee,
    balance,
  });

  return { hasInsufficientBalance: insufficientBalance, nativeCurrency };
}
