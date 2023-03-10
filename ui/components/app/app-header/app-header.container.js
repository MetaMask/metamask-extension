import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  getUnreadNotificationsCount,
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(beta)
  getShowBetaHeader,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';

import * as actions from '../../../store/actions';
import AppHeader from './app-header.component';

const mapStateToProps = (state) => {
  const { appState, metamask } = state;
  const { networkDropdownOpen } = appState;
  const {
    selectedAddress,
    isUnlocked,
    isAccountMenuOpen,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    desktopEnabled,
    ///: END:ONLY_INCLUDE_IN
  } = metamask;

  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  const unreadNotificationsCount = getUnreadNotificationsCount(state);
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(beta)
  const showBetaHeader = getShowBetaHeader(state);
  ///: END:ONLY_INCLUDE_IN

  return {
    networkDropdownOpen,
    selectedAddress,
    isUnlocked,
    isAccountMenuOpen,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationsCount,
    desktopEnabled,
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(beta)
    showBetaHeader,
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
