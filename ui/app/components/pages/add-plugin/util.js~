import R from 'ramda'

export function checkExistingAddresses (address, tokenList = []) {
  if (!address) {
    return false
  }

  const matchesAddress = existingToken => {
    return existingToken.address.toLowerCase() === address.toLowerCase()
  }

  return R.any(matchesAddress)(tokenList)
}
