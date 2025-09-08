import { useSelector } from 'react-redux';
import { getAccountByAddress } from '../../../helpers/utils/util';
import {
  accountsWithSendEtherInfoSelector,
  getIsMultichainAccountsState2Enabled,
} from '../../../selectors';
import { getConfirmationSender } from '../components/confirm/utils';
import { useConfirmContext } from '../context/confirm';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';

function useConfirmationRecipientInfo() {
  const { currentConfirmation } = useConfirmContext();
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const allAccountGroups = useSelector((state: MultichainAccountsState) =>
    getAccountGroupsByAddress(
      state,
      allAccounts.map((a) => a.address),
    ),
  );

  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );

  let senderAddress: string | undefined;
  let senderName: string | undefined;

  if (currentConfirmation) {
    const { from } = getConfirmationSender(currentConfirmation);
    senderAddress = from;
    if (isMultichainAccountsState2Enabled) {
      const group = allAccountGroups.find((g) =>
        g.accounts.some(
          (a) => a.address?.toLowerCase() === from?.toLowerCase(),
        ),
      );
      senderName = group?.metadata?.name;
    } else {
      const allInternalAccounts = allAccountGroups.flatMap((g) => g.accounts);
      const fromAccount = getAccountByAddress(allInternalAccounts, from);
      senderName = fromAccount?.metadata?.name;
    }
  }

  return {
    senderAddress: senderAddress ?? '',
    senderName: senderName ?? '',
  };
}

export default useConfirmationRecipientInfo;
