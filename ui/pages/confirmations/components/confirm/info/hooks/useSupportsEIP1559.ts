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

export function useSupportsEIP1559(transactionMeta: TransactionMeta) {
  const isLegacyTxn =
    transactionMeta?.txParams?.type === TransactionEnvelopeType.legacy ||
    isLegacyTransaction(transactionMeta);

  const selectedNetworkClientId = useSelector(getSelectedNetworkClientId);

  const networkAndAccountSupports1559 = useSelector((state) =>
    checkNetworkAndAccountSupports1559(state, selectedNetworkClientId),
  );

  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return { supportsEIP1559 };
}
