// path constants
const STATUS_PATH = '/status'
const GAS_PRICE_PATH = '/txParams/gasPrice'

// status constants
const UNAPPROVED_STATUS = 'unapproved'
const SUBMITTED_STATUS = 'submitted'
const CONFIRMED_STATUS = 'confirmed'
const DROPPED_STATUS = 'dropped'

// op constants
const REPLACE_OP = 'replace'

// event constants
const TRANSACTION_CREATED_EVENT = 'transactionCreated'
const TRANSACTION_UPDATED_GAS_EVENT = 'transactionUpdatedGas'
const TRANSACTION_SUBMITTED_EVENT = 'transactionSubmitted'
const TRANSACTION_CONFIRMED_EVENT = 'transactionConfirmed'
const TRANSACTION_DROPPED_EVENT = 'transactionDropped'
const TRANSACTION_UPDATED_EVENT = 'transactionUpdated'
const TRANSACTION_ERRORED_EVENT = 'transactionErrored'

const eventPathsHash = {
  [STATUS_PATH]: true,
  [GAS_PRICE_PATH]: true,
}

const statusHash = {
  [SUBMITTED_STATUS]: TRANSACTION_SUBMITTED_EVENT,
  [CONFIRMED_STATUS]: TRANSACTION_CONFIRMED_EVENT,
  [DROPPED_STATUS]: TRANSACTION_DROPPED_EVENT,
}

function eventCreator (eventKey, timestamp, value) {
  return {
    eventKey,
    timestamp,
    value,
  }
}

export function getActivities (transaction) {
  const { history = [], txReceipt: { status } = {} } = transaction

  const historyActivities = history.reduce((acc, base) => {
    // First history item should be transaction creation
    if (!Array.isArray(base) && base.status === UNAPPROVED_STATUS && base.txParams) {
      const { time, txParams: { value } = {} } = base
      return acc.concat(eventCreator(TRANSACTION_CREATED_EVENT, time, value))
      // An entry in the history may be an array of more sub-entries.
    } else if (Array.isArray(base)) {
      const events = []

      base.forEach(entry => {
        const { op, path, value, timestamp: entryTimestamp } = entry
        // Not all sub-entries in a history entry have a timestamp. If the sub-entry does not have a
        // timestamp, the first sub-entry in a history entry should.
        const timestamp = entryTimestamp || base[0] && base[0].timestamp

        if (path in eventPathsHash && op === REPLACE_OP) {
          switch (path) {
            case STATUS_PATH: {
              if (value in statusHash) {
                events.push(eventCreator(statusHash[value], timestamp))
              }

              break
            }

            case GAS_PRICE_PATH: {
              events.push(eventCreator(TRANSACTION_UPDATED_GAS_EVENT, timestamp, value))
              break
            }

            default: {
              events.push(eventCreator(TRANSACTION_UPDATED_EVENT, timestamp))
            }
          }
        }
      })

      return acc.concat(events)
    }

    return acc
  }, [])

  // If txReceipt.status is '0x0', that means that an on-chain error occured for the transaction,
  // so we add an error entry to the Activity Log.
  return status === '0x0'
    ? historyActivities.concat(eventCreator(TRANSACTION_ERRORED_EVENT))
    : historyActivities
}
