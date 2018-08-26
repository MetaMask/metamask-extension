// path constants
const STATUS_PATH = '/status'
const GAS_PRICE_PATH = '/txParams/gasPrice'

// status constants
const STATUS_UNAPPROVED = 'unapproved'
const STATUS_SUBMITTED = 'submitted'
const STATUS_CONFIRMED = 'confirmed'
const STATUS_DROPPED = 'dropped'

// op constants
const REPLACE_OP = 'replace'

const eventPathsHash = {
  [STATUS_PATH]: true,
  [GAS_PRICE_PATH]: true,
}

const statusHash = {
  [STATUS_SUBMITTED]: true,
  [STATUS_CONFIRMED]: true,
  [STATUS_DROPPED]: true,
}

function eventCreator (eventKey, timestamp, value, valueDescriptionKey) {
  return {
    eventKey,
    timestamp,
    value,
    valueDescriptionKey,
  }
}

export function getActivities (transaction) {
  const { history = [] } = transaction

  return history.reduce((acc, base) => {
    // First history item should be transaction creation
    if (!Array.isArray(base) && base.status === STATUS_UNAPPROVED && base.txParams) {
      const { time, txParams: { value } = {} } = base
      return acc.concat(eventCreator('created', time, value, 'value'))
    } else if (Array.isArray(base)) {
      const events = []

      base.forEach(entry => {
        const { op, path, value, timestamp } = entry

        if (path in eventPathsHash && op === REPLACE_OP) {
          switch (path) {
            case STATUS_PATH: {
              if (value in statusHash) {
                events.push(eventCreator(value, timestamp))
              }

              break
            }

            case GAS_PRICE_PATH: {
              events.push(eventCreator('updated', timestamp, value, 'gasPrice'))
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
