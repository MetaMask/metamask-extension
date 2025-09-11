import { useSelector } from 'react-redux';
import { getIsMultichainAccountsState2Enabled } from '../../../selectors';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import {
  selectAccountGroupNameByInternalAccount,
  selectInternalAccountNameByAddress,
} from '../selectors/accounts';

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

  const internalAccountName = useSelector((state: MultichainAccountsState) =>
    selectInternalAccountNameByAddress(state, senderAddress),
  );

  const senderName = isMultichainAccountsState2Enabled
    ? accountGroupName
    : internalAccountName;

  return {
    senderAddress,
    senderName: senderName ?? '',
  };
}

export default useConfirmationRecipientInfo;
