import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import actions from '../../actions'
import AccountMenu from './account-menu.component'


export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(AccountMenu)

function mapStateToProps (state) {
  return {
    selectedAddress: state.metamask.selectedAddress,
    isAccountMenuOpen: state.metamask.isAccountMenuOpen,
    keyrings: state.metamask.keyrings,
    identities: state.metamask.identities,
    accounts: state.metamask.accounts,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
    showAccountDetail: address => {
      dispatch(actions.showAccountDetail(address))
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    lockMetamask: () => {
      dispatch(actions.lockMetamask())
      dispatch(actions.hideWarning())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    showConfigPage: () => {
      dispatch(actions.showConfigPage())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
    showInfoPage: () => {
      dispatch(actions.showInfoPage())
      dispatch(actions.hideSidebar())
      dispatch(actions.toggleAccountMenu())
    },
  }
}
