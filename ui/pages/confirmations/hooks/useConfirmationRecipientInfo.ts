import { useSelector } from 'react-redux';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import { selectAccountGroupNameByInternalAccount } from '../selectors/accounts';
import {
  getWalletIdAndNameByAccountAddress,
  getWalletsWithAccounts,
} from '../../../selectors/multichain-accounts/account-tree';

function useConfirmationRecipientInfo() {
  const { currentConfirmation } = useConfirmContext();

  const { from } = getConfirmationSender(currentConfirmation);
  const senderAddress = from ?? '';

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, senderAddress),
  );

  const walletInfo = useSelector((state: MultichainAccountsState) =>
    getWalletIdAndNameByAccountAddress(state, senderAddress),
  );

  const walletsWithAccounts = useSelector(getWalletsWithAccounts);

  const hasMoreThanOneWallet = Object.keys(walletsWithAccounts).length > 1;

  return {
    hasMoreThanOneWallet,
    senderAddress,
    senderName: accountGroupName ?? '',
    walletName: walletInfo?.name ?? '',
  };
}

export default useConfirmationRecipientInfo;
