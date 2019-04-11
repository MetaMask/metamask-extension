import NetworksTab from './networks-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  // displayWarning,
  // revealSeedConfirmation,
  // setFeatureFlag,
  // showModal,
  // setParticipateInMetaMetrics,
} from '../../../store/actions'

const defaultNetworks = [
  { labelKey: 'mainnet', iconColor: '#29B6AF', providerType: 'mainnet' },
  { labelKey: 'ropsten', iconColor: '#FF4A8D', providerType: 'ropsten' },
  { labelKey: 'kovan', iconColor: '#9064FF', providerType: 'kovan' },
  { labelKey: 'rinkeby', iconColor: '#F6C343', providerType: 'rinkeby' },
  { labelKey: 'localhost', iconColor: 'white', border: '1px solid #6A737D', providerType: 'localhost' },
]

const mapStateToProps = state => {
  const {
    frequentRpcListDetail,
  } = state.metamask

  const frequentRpcNetworkListDetails = frequentRpcListDetail.map(rpc => {
    return {
      label: rpc.nickname,
      iconColor: '#6A737D',
      providerType: 'rpc',
      rpcUrl: rpc.rpcUrl
    }
  })

  return {
    networksToRender: [ ...defaultNetworks, ...frequentRpcNetworkListDetails ],
  }
}

const mapDispatchToProps = dispatch => {
  return {
    selectNetwork: () => {},
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NetworksTab)
