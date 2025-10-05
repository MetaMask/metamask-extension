import { useSelector } from 'react-redux';

// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../../../../app/scripts/lib/multichain/address';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import { getSelectedAccount } from '../../../../../../../selectors';
import { useUnapprovedTransactionWithFallback } from '../../../../../hooks/transactions/useUnapprovedTransaction';

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
  const transactionMeta = useUnapprovedTransactionWithFallback();
  const selectedAccount = useSelector(getSelectedAccount);

  const { tokensWithBalances } = useAccountTotalFiatBalance(
    selectedAccount,
    true,
  ) as { tokensWithBalances: TokenWithBalance[] };

  const receivedToken = tokensWithBalances.find(
    (token) =>
      normalizeSafeAddress(transactionMeta.txParams.to as string) ===
      normalizeSafeAddress(token.address),
  );

  return { receivedToken };
};
