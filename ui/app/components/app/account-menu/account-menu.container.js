import { connect } from 'react-redux'
import { compose } from 'recompose'
import { withRouter } from 'react-router-dom'
import {
  toggleAccountMenu,
  showAccountDetail,
  hideSidebar,
  lockMetamask,
  hideWarning,
  showModal,
} from '../../../store/actions'
<<<<<<< HEAD
import { getMetaMaskAccounts } from '../../../selectors/selectors'
=======
import {
  getAddressConnectedDomainMap,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getOriginOfCurrentTab,
  getSelectedAddress,
  // getLastSelectedAddress,
  // getPermittedAccounts,
} from '../../../selectors/selectors'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
import AccountMenu from './account-menu.component'

/**
 * The min amount of accounts to show search field
 */
const SHOW_SEARCH_ACCOUNTS_MIN_COUNT = 5

function mapStateToProps (state) {
  const { metamask: { isAccountMenuOpen } } = state
  const accounts = getMetaMaskAccountsOrdered(state)
  const origin = getOriginOfCurrentTab(state)
  const selectedAddress = getSelectedAddress(state)

  /**
   * TODO:LoginPerSite:ui
   * - propagate the relevant props below after computing them
   */
  // const lastSelectedAddress = getLastSelectedAddress(state, origin)
  // const permittedAccounts = getPermittedAccounts(state, origin)
  // const selectedAccountIsPermitted = permittedAccounts.includes(selectedAddress)

  return {
    isAccountMenuOpen,
<<<<<<< HEAD
    keyrings,
    identities,
    accounts: getMetaMaskAccounts(state),
=======
    addressConnectedDomainMap: getAddressConnectedDomainMap(state),
    originOfCurrentTab: origin,
    selectedAddress: selectedAddress,
    keyrings: getMetaMaskKeyrings(state),
    accounts,
    shouldShowAccountsSearch: accounts.length >= SHOW_SEARCH_ACCOUNTS_MIN_COUNT,
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
  }
}

function mapDispatchToProps (dispatch) {
  return {
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    showAccountDetail: (address) => {
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
    showRemoveAccountConfirmationModal: (identity) => {
      return dispatch(showModal({ name: 'CONFIRM_REMOVE_ACCOUNT', identity }))
    },
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AccountMenu)
