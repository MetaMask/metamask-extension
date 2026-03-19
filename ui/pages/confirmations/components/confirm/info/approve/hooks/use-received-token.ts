import { useSelector } from 'react-redux';

// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../../../../app/scripts/lib/multichain/address';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import { getSelectedAccount } from '../../../../../../../selectors';
import { useTransactionMetadataRequest } from '../../../../../hooks/useTransactionMetadataRequest';

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
  const transactionMeta = useTransactionMetadataRequest();

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
