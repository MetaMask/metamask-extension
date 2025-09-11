import { useSelector } from 'react-redux';
import {
  accountsWithSendEtherInfoSelector,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  selectAccountGroupNameByInternalAccount,
  selectInternalAccountNameByAddress,
} from '../selectors/accounts';

function useConfirmationRecipientInfo(): {
  senderAddress: string;
  senderName: string;
} {
  const { currentConfirmation } = useConfirmContext();
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  const { from } = getConfirmationSender(currentConfirmation);

  const addresses: string[] = allAccounts.map((account) => account.address);

  const accountGroupName = useSelector((state: MultichainAccountsState) =>
    selectAccountGroupNameByInternalAccount(state, addresses, from),
  );

  const internalAccountName = useSelector((state: MultichainAccountsState) =>
    selectInternalAccountNameByAddress(state, addresses, from),
  );

  const senderName = isMultichainAccountsState2Enabled
    ? accountGroupName
    : internalAccountName;

  return {
    senderAddress: from ?? '',
    senderName: senderName ?? '',
  };
}

export default useConfirmationRecipientInfo;
