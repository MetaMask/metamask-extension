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
  const { history = [] } = transaction

  return history.reduce((acc, base) => {
    // First history item should be transaction creation
    if (!Array.isArray(base) && base.status === UNAPPROVED_STATUS && base.txParams) {
      const { time, txParams: { value } = {} } = base
      return acc.concat(eventCreator(TRANSACTION_CREATED_EVENT, time, value))
    } else if (Array.isArray(base)) {
      const events = []

      base.forEach(entry => {
        const { op, path, value, timestamp } = entry

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
              events.push(eventCreator(value, timestamp))
            }
          }
        }
      })

      return acc.concat(events)
    }

    return acc
  }, [])
}
