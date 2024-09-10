import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

import { normalizeSafeAddress } from '../../../../../../../../app/scripts/lib/multichain/address';
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

  const receivedToken = tokensWithBalances.find(
    (token) =>
      normalizeSafeAddress(transactionMeta.txParams.to as string) ===
      normalizeSafeAddress(token.address),
  );

  return { receivedToken };
};
