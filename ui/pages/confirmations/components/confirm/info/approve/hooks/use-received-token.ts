import { TransactionMeta } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';

// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { normalizeSafeAddress } from '../../../../../../../../app/scripts/lib/multichain/address';
import { useAccountTotalFiatBalance } from '../../../../../../../hooks/useAccountTotalFiatBalance';
import { getSelectedAccount } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';

export const useReceivedToken = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const selectedAccount = useSelector(getSelectedAccount);

  const { tokensWithBalances } = useAccountTotalFiatBalance(
    selectedAccount,
    true,
  );

  const receivedToken = tokensWithBalances.find(
    (token) =>
      normalizeSafeAddress(transactionMeta.txParams.to as string) ===
      normalizeSafeAddress(token.address),
  );

  return { receivedToken };
};
