import { useSelector } from 'react-redux';

import {
  accountsWithSendEtherInfoSelector,
  currentConfirmationSelector,
} from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { SignatureRequestType } from '../types/confirm';

function useConfirmationRecipientInfo() {
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as SignatureRequestType;
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  let recipientAddress = '';
  let recipientName = '';

  if (currentConfirmation) {
    const msgParams = currentConfirmation?.msgParams;

    // url for all signature requests
    if (msgParams) {
      recipientAddress = msgParams.from;
      const fromAccount = getAccountByAddress(allAccounts, recipientAddress);
      recipientName = fromAccount?.metadata?.name;
    }
    // TODO: as we add support for more transaction code to find recipient address for different
    // transaction types will come here
  }

  return {
    recipientAddress,
    recipientName,
  };
}

export default useConfirmationRecipientInfo;
