import { useSelector } from 'react-redux';

import {
  accountsWithSendEtherInfoSelector,
  currentConfirmationSelector,
} from '../../../selectors';
import { getAccountByAddress } from '../../../helpers/utils/util';

function useConfirmationRecipientInfo() {
  const currentConfirmation = useSelector(currentConfirmationSelector);
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);

  let fromAddress = '';
  let fromName = '';

  if (currentConfirmation) {
    const { msgParams } = currentConfirmation;
    // url for all signature requests
    if (msgParams) {
      fromAddress = msgParams.from;
      const fromAccount = getAccountByAddress(allAccounts, fromAddress);
      console.log('Dickie: fromAccount', fromAccount);
      fromName = fromAccount?.metadata?.name;
    }
    // TODO: as we add support for more transaction code to find recipient address for different
    // transaction types will come here
  }

  return {
    fromAddress: fromAddress,
    fromName: fromName,
  };
}

export default useConfirmationRecipientInfo;
