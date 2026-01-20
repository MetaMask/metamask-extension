import { useSelector } from 'react-redux';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import { selectAccountGroupNameByInternalAccount } from '../selectors/accounts';
import { RootState } from '../selectors/preferences';
import {
  getWalletIdAndNameByAccountAddress,
  getWalletsWithAccounts,
} from '../../../selectors/multichain-accounts/account-tree';
import { useIsBIP44 } from './useIsBIP44';

function useConfirmationRecipientInfo() {
  const { currentConfirmation } = useConfirmContext();
  const isBIP44 = useIsBIP44();

  const { from } = getConfirmationSender(currentConfirmation);
  const senderAddress = from ?? '';

  const senderName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, senderAddress),
  );

  const walletInfo = useSelector((state: RootState) =>
    getWalletIdAndNameByAccountAddress(state, senderAddress),
  );

  const walletsWithAccounts = useSelector(getWalletsWithAccounts);

  const hasMoreThanOneWallet = Object.keys(walletsWithAccounts).length > 1;

  return {
    hasMoreThanOneWallet,
    isBIP44,
    senderAddress,
    senderName: senderName ?? '',
    walletName: walletInfo?.name ?? '',
  };
}

export default useConfirmationRecipientInfo;
