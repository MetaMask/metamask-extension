import { TransactionType } from '../../../../shared/constants/transaction';
import { sumHexes } from '../../../../shared/modules/conversion.utils';
import { getHexGasTotal } from '../../../helpers/utils/confirm-tx.util';

import {
  // event constants
  TRANSACTION_CREATED_EVENT,
  TRANSACTION_SUBMITTED_EVENT,
  TRANSACTION_RESUBMITTED_EVENT,
  TRANSACTION_CONFIRMED_EVENT,
  TRANSACTION_DROPPED_EVENT,
  TRANSACTION_UPDATED_EVENT,
  TRANSACTION_ERRORED_EVENT,
  TRANSACTION_CANCEL_ATTEMPTED_EVENT,
  TRANSACTION_CANCEL_SUCCESS_EVENT,
  // status constants
  SUBMITTED_STATUS,
  CONFIRMED_STATUS,
  DROPPED_STATUS,
} from './transaction-activity-log.constants';

// path constants
const STATUS_PATH = '/status';
const GAS_PRICE_PATH = '/txParams/gasPrice';
const GAS_LIMIT_PATH = '/txParams/gas';
const ESTIMATE_BASE_FEE_PATH = '/estimatedBaseFee';
const BLOCKTIMESTAMP = '/blockTimestamp';

// op constants
const REPLACE_OP = 'replace';

const eventPathsHash = {
  [STATUS_PATH]: true,
  [GAS_PRICE_PATH]: true,
  [GAS_LIMIT_PATH]: true,
  [BLOCKTIMESTAMP]: true,
};

const statusHash = {
  [SUBMITTED_STATUS]: TRANSACTION_SUBMITTED_EVENT,
  [CONFIRMED_STATUS]: TRANSACTION_CONFIRMED_EVENT,
  [DROPPED_STATUS]: TRANSACTION_DROPPED_EVENT,
};

/**
 * @name getActivities
 * @param {object} transaction - txMeta object
 * @param {boolean} isFirstTransaction - True if the transaction is the first created transaction
 * in the list of transactions with the same nonce. If so, we use this transaction to create the
 * transactionCreated activity.
 * @returns {Array}
 */
export function getActivities(transaction, isFirstTransaction = false) {
  const {
    id,
    chainId,
    metamaskNetworkId,
    hash,
    history = [],
    txParams: {
      gas: paramsGasLimit,
      gasPrice: paramsGasPrice,
      maxPriorityFeePerGas: paramsMaxPriorityFeePerGas,
    },
    txReceipt: { status } = {},
    type,
    estimatedBaseFee: paramsEstimatedBaseFee,
  } = transaction;

  const paramsEip1559Price =
    paramsEstimatedBaseFee &&
    paramsMaxPriorityFeePerGas &&
    sumHexes(paramsEstimatedBaseFee, paramsMaxPriorityFeePerGas);
  let cachedGasLimit = '0x0';
  let cachedGasPrice = '0x0';

  const historyActivities = history.reduce((acc, base, index) => {
    // First history item should be transaction creation
    if (index === 0 && !Array.isArray(base) && base.txParams) {
      const {
        time: timestamp,
        estimatedBaseFee,
        txParams: { value, gas = '0x0', gasPrice, maxPriorityFeePerGas } = {},
      } = base;

      const eip1559Price =
        estimatedBaseFee &&
        maxPriorityFeePerGas &&
        sumHexes(estimatedBaseFee, maxPriorityFeePerGas);
      // The cached gas limit and gas price are used to display the gas fee in the activity log. We
      // need to cache these values because the status update history events don't provide us with
      // the latest gas limit and gas price.
      cachedGasLimit = gas;
      cachedGasPrice = eip1559Price || gasPrice || paramsGasPrice || '0x0';

      if (isFirstTransaction) {
        return acc.concat({
          id,
          hash,
          chainId,
          metamaskNetworkId,
          eventKey: TRANSACTION_CREATED_EVENT,
          timestamp,
          value,
        });
      }
      // An entry in the history may be an array of more sub-entries.
    } else if (Array.isArray(base)) {
      const events = [];

      base.forEach((entry) => {
        const { op, path, value, timestamp: entryTimestamp } = entry;
        // Not all sub-entries in a history entry have a timestamp. If the sub-entry does not have a
        // timestamp, the first sub-entry in a history entry should.
        const timestamp = entryTimestamp || (base[0] && base[0].timestamp);

        const isAddBaseFee = path === ESTIMATE_BASE_FEE_PATH && op === 'add';

        if ((path in eventPathsHash && op === REPLACE_OP) || isAddBaseFee) {
          switch (path) {
            case STATUS_PATH: {
              const gasFee =
                cachedGasLimit === '0x0' && cachedGasPrice === '0x0'
                  ? getHexGasTotal({
                      gasLimit: paramsGasLimit,
                      gasPrice: paramsEip1559Price || paramsGasPrice,
                    })
                  : getHexGasTotal({
                      gasLimit: cachedGasLimit,
                      gasPrice: cachedGasPrice,
                    });

              if (value in statusHash) {
                let eventKey = statusHash[value];

                // If the status is 'submitted', we need to determine whether the event is a
                // transaction retry or a cancellation attempt.
                if (value === SUBMITTED_STATUS) {
                  if (type === TransactionType.retry) {
                    eventKey = TRANSACTION_RESUBMITTED_EVENT;
                  } else if (type === TransactionType.cancel) {
                    eventKey = TRANSACTION_CANCEL_ATTEMPTED_EVENT;
                  }
                } else if (value === CONFIRMED_STATUS) {
                  if (type === TransactionType.cancel) {
                    eventKey = TRANSACTION_CANCEL_SUCCESS_EVENT;
                  }
                }
                events.push({
                  id,
                  hash,
                  eventKey,
                  timestamp,
                  chainId,
                  metamaskNetworkId,
                  value: gasFee,
                });
              }
              break;
            }

            // If the gas price or gas limit has been changed, we update the gasFee of the
            // previously submitted event. These events happen when the gas limit and gas price is
            // changed at the confirm screen.
            case GAS_PRICE_PATH:
            case GAS_LIMIT_PATH:
            case ESTIMATE_BASE_FEE_PATH: {
              const lastEvent = events[events.length - 1] || {};
              const { lastEventKey } = lastEvent;

              if (path === GAS_LIMIT_PATH) {
                cachedGasLimit = value;
              } else if (path === GAS_PRICE_PATH) {
                cachedGasPrice = value;
              } else if (path === ESTIMATE_BASE_FEE_PATH) {
                cachedGasPrice = paramsEip1559Price || base?.txParams?.gasPrice;
                lastEvent.value = getHexGasTotal({
                  gasLimit: paramsGasLimit,
                  gasPrice: cachedGasPrice,
                });
              }

              if (
                lastEventKey === TRANSACTION_SUBMITTED_EVENT ||
                lastEventKey === TRANSACTION_RESUBMITTED_EVENT
              ) {
                lastEvent.value = getHexGasTotal({
                  gasLimit: cachedGasLimit,
                  gasPrice: cachedGasPrice,
                });
              }
              break;
            }

            case BLOCKTIMESTAMP: {
              const filteredAcc = acc.find(
                (ac) => ac.eventKey === TRANSACTION_CONFIRMED_EVENT,
              );
              if (filteredAcc !== undefined) {
                filteredAcc.timestamp = new Date(
                  parseInt(entry.value, 16) * 1000,
                ).getTime();
              }
              break;
            }

            default: {
              events.push({
                id,
                hash,
                chainId,
                metamaskNetworkId,
                eventKey: TRANSACTION_UPDATED_EVENT,
                timestamp,
              });
            }
          }
        }
      });

      return acc.concat(events);
    }

    return acc;
  }, []);

  // If txReceipt.status is '0x0', that means that an on-chain error occurred for the transaction,
  // so we add an error entry to the Activity Log.
  return status === '0x0'
    ? historyActivities.concat({
        id,
        hash,
        chainId,
        metamaskNetworkId,
        eventKey: TRANSACTION_ERRORED_EVENT,
      })
    : historyActivities;
}

/**
 * @description Removes "Transaction dropped" activities from a list of sorted activities if one of
 * the transactions has been confirmed. Typically, if multiple transactions have the same nonce,
 * once one transaction is confirmed, the rest are dropped. In this case, we don't want to show
 * multiple "Transaction dropped" activities, and instead want to show a single "Transaction
 * confirmed".
 * @param {Array} activities - List of sorted activities generated from the getActivities function.
 * @returns {Array}
 */
function filterSortedActivities(activities) {
  const filteredActivities = [];
  const hasConfirmedActivity = Boolean(
    activities.find(
      ({ eventKey }) =>
        eventKey === TRANSACTION_CONFIRMED_EVENT ||
        eventKey === TRANSACTION_CANCEL_SUCCESS_EVENT,
    ),
  );
  let addedDroppedActivity = false;

  activities.forEach((activity) => {
    if (activity.eventKey === TRANSACTION_DROPPED_EVENT) {
      if (!hasConfirmedActivity && !addedDroppedActivity) {
        filteredActivities.push(activity);
        addedDroppedActivity = true;
      }
    } else {
      filteredActivities.push(activity);
    }
  });

  return filteredActivities;
}

/**
 * Combines the histories of an array of transactions into a single array.
 *
 * @param {Array} transactions - Array of txMeta transaction objects.
 * @returns {Array}
 */
export function combineTransactionHistories(transactions = []) {
  if (!transactions.length) {
    return [];
  }

  const activities = [];

  transactions.forEach((transaction, index) => {
    // The first transaction should be the transaction with the earliest submittedTime. We show the
    // 'created' and 'submitted' activities here. All subsequent transactions will use 'resubmitted'
    // instead.
    const transactionActivities = getActivities(transaction, index === 0);
    activities.push(...transactionActivities);
  });

  const sortedActivities = activities.sort((a, b) => a.timestamp - b.timestamp);
  return filterSortedActivities(sortedActivities);
}
