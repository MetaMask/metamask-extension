// next version number
import { TRANSACTION_STATUSES } from '../../../shared/constants/transaction';
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

export default {
  version,

  migrate: failTxsThat(
    version,
    'Stuck in approved state for too long.',
    (txMeta) => {
      const isApproved = txMeta.status === TRANSACTION_STATUSES.APPROVED;
      const createdTime = txMeta.submittedTime;
      const now = Date.now();
      return isApproved && now - createdTime > unacceptableDelay;
    },
  ),
};
