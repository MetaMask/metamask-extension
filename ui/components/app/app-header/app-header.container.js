import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getUnreadNotificationCount } from '../../../selectors';

import * as actions from '../../../store/actions';
import AppHeader from './app-header.component';

const mapStateToProps = (state) => {
  const { appState, metamask } = state;
  const { networkDropdownOpen } = appState;
  const { selectedAddress, isUnlocked, isAccountMenuOpen } = metamask;

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const unreadNotificationCount = getUnreadNotificationCount(state);
  ///: END:ONLY_INCLUDE_IN

  return {
    networkDropdownOpen,
    selectedAddress,
    isUnlocked,
    isAccountMenuOpen,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationCount,
    ///: END:ONLY_INCLUDE_IN
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AppHeader);
