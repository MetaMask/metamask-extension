import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { normalizeSafeAddress } from '../../../../../../../../app/scripts/lib/multichain/address';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import {
  currentConfirmationSelector,
  getSelectedAccount,
} from '../../../../../../../selectors';

interface TokenWithBalance {
  address: string;
  balance: string;
  balanceError: unknown;
  decimals: number;
  image: unknown;
  isERC721: unknown;
  string: string;
  symbol: string;
}

export const useReceivedToken = () => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const selectedAccount = useSelector(getSelectedAccount);

  const { tokensWithBalances } = useAccountTotalFiatBalance(
    selectedAccount,
    true,
  ) as { tokensWithBalances: TokenWithBalance[] };

  let receivedToken;
  for (let i = 0; i < tokensWithBalances.length; i += 1) {
    if (
      normalizeSafeAddress(transactionMeta.txParams.to as string) ===
      normalizeSafeAddress(tokensWithBalances[i].address)
    ) {
      receivedToken = tokensWithBalances[i];
    }
  }

  return { receivedToken };
};
