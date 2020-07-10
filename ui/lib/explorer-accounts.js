import getAccountLink from './account-link'

export default function getExplorerAccounts (network) {
  const net = parseInt(network, 10)
  const accounts = []

  switch (net) {
    case 1: // main net
      accounts.push({
        name: 'ethplorer',
        title: 'viewOnEthplorer',
        eventName: 'Clicked View on Ethplorer',
        addressExplorerLink: address => `https://ethplorer.io/address/${address}`
      })
      break
  }

  return accounts
}
