import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  toggleAccountMenu,
  showAccountDetail,
  lockMetamask,
  hideWarning,
} from '../../../store/actions';
import {
  getAddressConnectedSubjectMap,
  getMetaMaskAccountsOrdered,
  getMetaMaskKeyrings,
  getOriginOfCurrentTab,
  getSelectedAddress,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  getUnreadNotificationsCount,
  ///: END:ONLY_INCLUDE_IN
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
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const unreadNotificationsCount = getUnreadNotificationsCount(state);
  ///: END:ONLY_INCLUDE_IN
  return {
    isAccountMenuOpen,
    addressConnectedSubjectMap: getAddressConnectedSubjectMap(state),
    originOfCurrentTab: origin,
    selectedAddress,
    keyrings: getMetaMaskKeyrings(state),
    accounts,
    shouldShowAccountsSearch: accounts.length >= SHOW_SEARCH_ACCOUNTS_MIN_COUNT,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationsCount,
    ///: END:ONLY_INCLUDE_IN
  };
}

function mapDispatchToProps(dispatch) {
  return {
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    showAccountDetail: (address) => {
      dispatch(showAccountDetail(address));
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
