import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  selectAccountGroupNameByInternalAccount,
  selectInternalAccountNameByAddress,
} from '../selectors/accounts';
import { RootState } from '../selectors/preferences';
import {
  getWalletIdAndNameByAccountAddress,
  getWalletsWithAccounts,
} from '../../../selectors/multichain-accounts/account-tree';

function useConfirmationRecipientInfo() {
  const { currentConfirmation } = useConfirmContext();
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const { from } = getConfirmationSender(currentConfirmation);
  const senderAddress = from ?? '';

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, senderAddress),
  );

  const internalAccountName = useSelector((state: RootState) =>
    selectInternalAccountNameByAddress(state, senderAddress),
  );

  const walletInfo = useSelector((state: RootState) =>
    getWalletIdAndNameByAccountAddress(state, senderAddress),
  );

  const walletsWithAccounts = useSelector(getWalletsWithAccounts);

  const senderName = isMultichainAccountsState2Enabled
    ? accountGroupName
    : internalAccountName;

  const hasMoreThanOneWallet = Object.keys(walletsWithAccounts).length > 1;

  return {
    hasMoreThanOneWallet,
    isBIP44: isMultichainAccountsState2Enabled,
    senderAddress,
    senderName: senderName ?? '',
    walletName: walletInfo?.name ?? '',
  };
}

export default useConfirmationRecipientInfo;
