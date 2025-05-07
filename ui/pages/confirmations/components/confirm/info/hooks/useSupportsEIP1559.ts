import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { isLegacyTransaction } from '../../../../../../helpers/utils/transactions.util';
import { checkNetworkAndAccountSupports1559 } from '../../../../../../selectors';

export function useSupportsEIP1559(transactionMeta: TransactionMeta) {
  const { networkClientId, txParams } = transactionMeta ?? {};

  const isLegacyTxn =
    txParams?.type === TransactionEnvelopeType.legacy ||
    isLegacyTransaction(transactionMeta);

  const networkAndAccountSupports1559 = useSelector((state) =>
    checkNetworkAndAccountSupports1559(state, networkClientId),
  );

  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return { supportsEIP1559 };
}
