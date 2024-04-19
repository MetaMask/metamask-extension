import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { isLegacyTransaction } from '../../../../../shared/modules/transaction.utils';
import { useSelector } from 'react-redux';
import { checkNetworkAndAccountSupports1559 } from '../../../../selectors';

export function useSupportsEIP1559(currentConfirmation: TransactionMeta) {
  let isLegacyTxn;
  if (currentConfirmation.txParams.type) {
    isLegacyTxn =
      currentConfirmation.txParams.type === TransactionEnvelopeType.legacy;
  } else {
    isLegacyTxn = isLegacyTransaction(currentConfirmation);
  }

  const networkAndAccountSupports1559 = useSelector((state) =>
    checkNetworkAndAccountSupports1559(
      state,
      currentConfirmation.networkClientId,
    ),
  );
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return { supportsEIP1559 };
}
