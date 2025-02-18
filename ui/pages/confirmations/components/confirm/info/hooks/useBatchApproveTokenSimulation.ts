import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { decodeApproveTokenData } from '../approve/hooks/use-approve-token-simulation';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import { useSelector } from 'react-redux';
import { BalanceChange } from '../../../simulation-details/types';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { Hex } from '@metamask/utils';
import { fetchErc20Decimals } from '../../../../utils/token';

export function useBatchApproveBalanceChanges() {
  const locale = useSelector(getIntlLocale);
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { chainId, nestedTransactions } = currentConfirmation ?? {};

  if (!nestedTransactions?.length) {
    return undefined;
  }

  const { pending, value } = useAsyncResult(
    async () =>
      await buildBalanceChanges({
        chainId: chainId as Hex,
        locale,
        nestedTransactions,
      }),
    [chainId, locale, nestedTransactions],
  );

  return { pending, value };
}

async function buildBalanceChanges({
  chainId,
  locale,
  nestedTransactions,
}: {
  chainId: Hex;
  locale: string;
  nestedTransactions: BatchTransactionParams[];
}): Promise<BalanceChange[]> {
  const balanceChanges: BalanceChange[] = [];

  for (const transaction of nestedTransactions) {
    const { data, to } = transaction;

    if (!data || !to) {
      continue;
    }

    const decimals = await fetchErc20Decimals(to);
    const approveValue = await decodeApproveTokenData({ data, decimals, locale, to });

    if (approveValue == undefined) {
      continue;
    }

    const { standard: tokenStandard } = await getTokenStandardAndDetails(to);

    const balanceChange: BalanceChange = {
      asset: {
        address: transaction.to,
        chainId,
        standard: tokenStandard as any,
      },
      amount: approveValue,
      fiatAmount: null,
    };

    balanceChanges.push(balanceChange);
  }

  return balanceChanges;
}
