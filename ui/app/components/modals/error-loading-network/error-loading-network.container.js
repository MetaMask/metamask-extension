
import { connect } from 'react-redux'

import ErrorLoadingNetwork from './error-loading-network.component'
const actions = require('../../../actions')

const mapStateToProps = state => {
  const { appState, metamask } = state
  const { networkDropdownOpen, errorLoadingNetworkModalOpen } = appState
  const {appState: {modal: { modalState: { props }}}} = state
  const {
    network,
    provider,
    selectedAddress,
    isUnlocked,
  } = metamask

  return {
    networkDropdownOpen,
    errorLoadingNetworkModalOpen,
    network,
    provider,
    selectedAddress,
    isUnlocked,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    showErrorLoadingNetworkModal: () => dispatch(actions.showErrorLoadingNetworkModal()),
    hideErrorLoadingNetworkModal: () => dispatch(actions.hideErrorLoadingNetworkModal()),
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type))
    }
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { onHide, ...otherStateProps } = stateProps
  const { hideModal, ...otherDispatchProps } = dispatchProps

  return {
    ...otherStateProps,
    ...otherDispatchProps,
    ...ownProps,
    hideModal
  }
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(ErrorLoadingNetwork)

