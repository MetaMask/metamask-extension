// next version number
import {
  TransactionStatus,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { LegacyMigration } from '../lib/migrator';
import failTxsThat from './fail-tx';

const version = 29;

// time
const seconds = 1000;
const minutes = 60 * seconds;
const hours = 60 * minutes;
const unacceptableDelay = 12 * hours;

/*

normalizes txParams on unconfirmed txs

*/

type LegacyTransactionMeta = Pick<TransactionMeta, 'status'> & {
  submittedTime?: number;
};

export default {
  version,

  migrate: failTxsThat(
    version,
    'Stuck in approved state for too long.',
    (txMeta: LegacyTransactionMeta) => {
      const isApproved = txMeta.status === TransactionStatus.approved;
      const createdTime = txMeta.submittedTime;
      const now = Date.now();
      return isApproved && now - (createdTime ?? NaN) > unacceptableDelay;
    },
  ),
} satisfies LegacyMigration;
