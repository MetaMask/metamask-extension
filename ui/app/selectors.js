const selectors = {
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedAccount,
}

module.exports = selectors

function getSelectedAddress(state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(accounts)[0]

  return selectedAddress
}

function getSelectedIdentity(state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getSelectedAccount(state) {
  const accounts = state.metamask.accounts
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}