import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { isLegacyTransaction } from '../../../../../../helpers/utils/transactions.util';
import {
  checkNetworkAndAccountSupports1559,
  getSelectedNetworkClientId,
} from '../../../../../../selectors';

export function useSupportsEIP1559(currentConfirmation: TransactionMeta) {
  let isLegacyTxn;
  if (currentConfirmation.txParams.type) {
    isLegacyTxn =
      currentConfirmation.txParams.type === TransactionEnvelopeType.legacy;
  } else {
    isLegacyTxn = isLegacyTransaction(currentConfirmation);
  }

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  // todo: how do I override state.metamask.networkMetadata
  const networkAndAccountSupports1559 = useSelector((state) =>
    checkNetworkAndAccountSupports1559(state, selectedNetworkClientId),
  );

  // const networkAndAccountSupports1559 = false;
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return { supportsEIP1559 };
}
