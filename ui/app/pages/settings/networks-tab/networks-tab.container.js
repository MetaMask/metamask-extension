import NetworksTab from './networks-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setSelectedSettingsRpcUrl,
} from '../../../store/actions'

const defaultNetworks = [
  { labelKey: 'mainnet', iconColor: '#29B6AF', providerType: 'mainnet', rpcUrl: 'https://api.infura.io/v1/jsonrpc/mainnet', chainId: '1', ticker: 'ETH' },
  { labelKey: 'ropsten', iconColor: '#FF4A8D', providerType: 'ropsten', rpcUrl: 'https://api.infura.io/v1/jsonrpc/ropsten', chainId: '3', ticker: 'ETH' },
  { labelKey: 'kovan', iconColor: '#9064FF', providerType: 'kovan', rpcUrl: 'https://api.infura.io/v1/jsonrpc/kovan', chainId: '4', ticker: 'ETH' },
  { labelKey: 'rinkeby', iconColor: '#F6C343', providerType: 'rinkeby', rpcUrl: 'https://api.infura.io/v1/jsonrpc/rinkeby', chainId: '42', ticker: 'ETH' },
  { labelKey: 'localhost', iconColor: 'white', border: '1px solid #6A737D', providerType: 'localhost' },
]

const mapStateToProps = state => {
  const {
    frequentRpcListDetail,
  } = state.metamask
  const {
    networksTabSelectedRpcUrl,
  } = state.appState

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map(rpc => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: 'rpc',
      rpcUrl: rpc.rpcUrl,
      chainId: rpc.chainId,
      ticker: rpc.ticker,
    }
  })
  const networksToRender = [ ...defaultNetworks, ...frequentRpcNetworkListDetails ]
  const selectedNetwork = networksToRender.find(network => network.rpcUrl === networksTabSelectedRpcUrl) || defaultNetworks[0]

  return {
    selectedNetwork,
    networksToRender,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    selectNetwork: () => {},
    setSelectedSettingsRpcUrl: newRpcUrl => dispatch(setSelectedSettingsRpcUrl(newRpcUrl)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworksTab)
