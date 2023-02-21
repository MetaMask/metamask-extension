import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  toggleAccountMenu,
  setSelectedAccount,
  lockMetamask,
  hideWarning,
} from '../../../store/actions';
import {
  getAddressConnectedSubjectMap,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getOriginOfCurrentTab,
  getSelectedAddress,
  getUnreadNotificationsCount,
} from '../../../selectors';
import AccountMenu from './account-menu.component';

/**
 * The min amount of accounts to show search field
 */
const SHOW_SEARCH_ACCOUNTS_MIN_COUNT = 5;

function mapStateToProps(state) {
  const {
    metamask: { isAccountMenuOpen },
  } = state;
  const accounts = getMetaMaskAccountsOrdered(state);
  const origin = getOriginOfCurrentTab(state);
  const selectedAddress = getSelectedAddress(state);
  const unreadNotificationsCount = getUnreadNotificationsCount(state);
  return {
    isAccountMenuOpen,
    addressConnectedSubjectMap: getAddressConnectedSubjectMap(state),
    originOfCurrentTab: origin,
    selectedAddress,
    keyrings: getMetaMaskKeyrings(state),
    accounts,
    shouldShowAccountsSearch: accounts.length >= SHOW_SEARCH_ACCOUNTS_MIN_COUNT,
    unreadNotificationsCount,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    setSelectedAccount: (address) => {
      dispatch(setSelectedAccount(address));
      dispatch(toggleAccountMenu());
    },
    lockMetamask: () => {
      dispatch(lockMetamask());
      dispatch(hideWarning());
      dispatch(toggleAccountMenu());
    },
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AccountMenu);
