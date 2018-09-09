
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

import ErrorLoadingScreen from './error-loading-screen.component'
const actions = require('../../actions')

const mapStateToProps = state => {
  const { appState, metamask } = state
  const { networkDropdownOpen } = appState
  const { errorLoadingScreenOpen } = appState
  const {
    network,
    provider,
    selectedAddress,
    isUnlocked,
  } = metamask

  return {
    networkDropdownOpen,
    errorLoadingScreenOpen,
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
    showErrorLoadingScreen: () => dispatch(actions.showErrorLoadingScreen()),
    hideErrorLoadingScreen: () => dispatch(actions.hideErrorLoadingScreen()),
    setProviderType: (type) => {
      dispatch(actions.setProviderType(type))
    }
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(ErrorLoadingScreen)
