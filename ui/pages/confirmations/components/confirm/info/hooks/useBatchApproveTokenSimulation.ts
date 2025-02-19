import {
  BatchTransactionParams,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { decodeApproveTokenData } from '../approve/hooks/use-approve-token-simulation';
import { getIntlLocale } from '../../../../../../ducks/locale/locale';
import { useSelector } from 'react-redux';
import {
  BalanceChange,
  TokenAssetIdentifier,
} from '../../../simulation-details/types';
import { useAsyncResult } from '../../../../../../hooks/useAsyncResult';
import { getTokenStandardAndDetails } from '../../../../../../store/actions';
import { Hex, add0x } from '@metamask/utils';
import { fetchErc20Decimals } from '../../../../utils/token';
import { TokenStandard } from '../../../../../../../shared/constants/transaction';
import { toHex } from '@metamask/controller-utils';

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

    const tokenData = await getTokenStandardAndDetails(to);
    const tokenStandard = tokenData?.standard as TokenStandard;
    let decimals = undefined;

    if (tokenStandard === TokenStandard.ERC20) {
      decimals = await fetchErc20Decimals(to);
    }

    const approveAmountOrId = await decodeApproveTokenData({
      data,
      decimals,
      locale,
      to,
    });

    if (approveAmountOrId == undefined) {
      continue;
    }

    const tokenId =
      tokenStandard === TokenStandard.ERC721
        ? add0x(approveAmountOrId.toString(16))
        : undefined;

    const balanceChange: BalanceChange = {
      asset: {
        address: to,
        chainId,
        standard: tokenStandard as TokenAssetIdentifier['standard'],
        tokenId,
      },
      amount: approveAmountOrId,
      fiatAmount: null,
      isApproval: true,
    };

    balanceChanges.push(balanceChange);
  }

  return balanceChanges;
}
