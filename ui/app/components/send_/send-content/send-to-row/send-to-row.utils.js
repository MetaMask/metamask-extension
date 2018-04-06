const { isValidAddress } = require('../../../../util')

function getToErrorObject (to) {
  let toError = null

  if (!to) {
      toError = 'required'
  } else if (!isValidAddress(to)) {
      toError = 'invalidAddressRecipient'
  }
  
  return { to: toError }
}

module.exports = {
  getToErrorObject
}
