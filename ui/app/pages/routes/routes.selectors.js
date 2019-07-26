import { getNetworkIdentifier } from '../../selectors/selectors'
import { getMessage } from '../../helpers/utils/i18n-helper'

export function isLoadingNetwork (state) {
  const {
    appState: {
      currentView,
    },
    metamask: {
      network,
    },
  } = state
  return network === 'loading' && currentView.name !== 'config'
}

export function getLoadMessage (state) {
  const {
    appState: {
      loadingMessage,
    },
    metamask: {
      provider,
    },
  } = state

  const providerName = provider.type

  if (loadingMessage) {
    return loadingMessage
  } else if (isLoadingNetwork(state)) {
    if (providerName === 'mainnet') {
      return getMessage('connectingToMainnet')
    } else if (providerName === 'ropsten') {
      return getMessage('connectingToRopsten')
    } else if (providerName === 'kovan') {
      return getMessage('connectingToKovan')
    } else if (providerName === 'rinkeby') {
      return getMessage('connectingToRinkeby')
    } else if (providerName === 'localhost') {
      return getMessage('connectingToLocalhost')
    } else if (providerName === 'goerli') {
      return getMessage('connectingToGoerli')
    } else {
      const providerId = getNetworkIdentifier(state)
      return getMessage('connectingTo', [providerId])
    }
  }

  return null
}
