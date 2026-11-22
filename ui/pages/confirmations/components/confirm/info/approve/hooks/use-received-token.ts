import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { normalizeSafeAddress } from '../../../../../../../../shared/lib/multichain/address';
import { resolveApprovalTokenContractAddress } from '../../../../../../../../shared/lib/transaction.utils';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import { getSelectedAccount } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';

export type TokenWithBalance = {
  address: string;
  balance: string;
  balanceError: unknown;
  decimals: number;
  image: unknown;
  isERC721: unknown;
  string: string;
  symbol: string;
};

export const useReceivedToken = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const selectedAccount = useSelector(getSelectedAccount);

  const { tokensWithBalances } = useAccountTotalFiatBalance(
    selectedAccount,
    true,
  ) as { tokensWithBalances: TokenWithBalance[] };

  const tokenAddress = resolveApprovalTokenContractAddress(transactionMeta);

  const receivedToken = tokensWithBalances.find(
    (token) =>
      normalizeSafeAddress(tokenAddress as string) ===
      normalizeSafeAddress(token.address),
  );

  return { receivedToken };
};
