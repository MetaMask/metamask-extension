import R from 'ramda'

export function checkExistingAddresses (address, layer2AppList = []) {
  if (!address) {
    return false
  }

  const matchesAddress = existingLayer2App => {
    return existingLayer2App.address.toLowerCase() === address.toLowerCase()
  }

  return R.any(matchesAddress)(layer2AppList)
}
