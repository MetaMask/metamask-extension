const {
  REQUIRED_ERROR,
  INVALID_RECIPIENT_ADDRESS_ERROR,
} = require('../../send.constants')
const { isValidAddress } = require('../../../../util')

function getToErrorObject (to) {
  let toError = null

  if (!to) {
    toError = REQUIRED_ERROR
  } else if (!isValidAddress(to)) {
    toError = INVALID_RECIPIENT_ADDRESS_ERROR
  }

  return { to: toError }
}

module.exports = {
  getToErrorObject,
}
