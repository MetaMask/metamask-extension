import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import {
  toggleAccountMenu,
  showAccountDetail,
  hideSidebar,
  lockMetamask,
  hideWarning,
  showConfigPage,
  showInfoPage,
  showModal,
} from '../../../store/actions'
import {
  getAddressConnectedDomainMap,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getOriginOfCurrentTab,
  getSelectedAddress,
} from '../../../selectors/selectors'
import AccountMenu from './account-menu.component'

/**
 * The min amount of accounts to show search field
 */
const SHOW_SEARCH_ACCOUNTS_MIN_COUNT = 5

function mapStateToProps (state) {
  const { metamask: { isAccountMenuOpen } } = state
  const accounts = getMetaMaskAccountsOrdered(state)

  return {
    isAccountMenuOpen,
    addressConnectedDomainMap: getAddressConnectedDomainMap(state),
    originOfCurrentTab: getOriginOfCurrentTab(state),
    selectedAddress: getSelectedAddress(state),
    keyrings: getMetaMaskKeyrings(state),
    accounts,
    shouldShowAccountsSearch: accounts.length >= SHOW_SEARCH_ACCOUNTS_MIN_COUNT,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    showAccountDetail: address => {
      dispatch(showAccountDetail(address))
      dispatch(hideSidebar())
      dispatch(toggleAccountMenu())
    },
    lockMetamask: () => {
      dispatch(lockMetamask())
      dispatch(hideWarning())
      dispatch(hideSidebar())
      dispatch(toggleAccountMenu())
    },
    showConfigPage: () => {
      dispatch(showConfigPage())
      dispatch(hideSidebar())
      dispatch(toggleAccountMenu())
    },
    showInfoPage: () => {
      dispatch(showInfoPage())
      dispatch(hideSidebar())
      dispatch(toggleAccountMenu())
    },
    showRemoveAccountConfirmationModal: identity => {
      return dispatch(showModal({ name: 'CONFIRM_REMOVE_ACCOUNT', identity }))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AccountMenu)
