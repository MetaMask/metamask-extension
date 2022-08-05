import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../ui/identicon';
import MetaFoxLogo from '../../ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { EVENT } from '../../../../shared/constants/metametrics';
import NetworkDisplay from '../network-display';

export default class AppHeader extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    networkDropdownOpen: PropTypes.bool,
    showNetworkDropdown: PropTypes.func,
    hideNetworkDropdown: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
    selectedAddress: PropTypes.string,
    isUnlocked: PropTypes.bool,
    hideNetworkIndicator: PropTypes.bool,
    disabled: PropTypes.bool,
    disableNetworkIndicator: PropTypes.bool,
    isAccountMenuOpen: PropTypes.bool,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationsCount: PropTypes.number,
    ///: END:ONLY_INCLUDE_IN
    onClick: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  handleNetworkIndicatorClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const {
      networkDropdownOpen,
      showNetworkDropdown,
      hideNetworkDropdown,
      disabled,
      disableNetworkIndicator,
    } = this.props;

    if (disabled || disableNetworkIndicator) {
      return;
    }

    if (networkDropdownOpen === false) {
      this.context.trackEvent({
        category: EVENT.CATEGORIES.NAVIGATION,
        event: 'Opened Network Menu',
        properties: {
          action: 'Home',
          legacy_event: true,
        },
      });
      showNetworkDropdown();
    } else {
      hideNetworkDropdown();
    }
  }

  renderAccountMenu() {
    const {
      isUnlocked,
      toggleAccountMenu,
      selectedAddress,
      disabled,
      isAccountMenuOpen,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      unreadNotificationsCount,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    return (
      isUnlocked && (
        <button
          className={classnames('account-menu__icon', {
            'account-menu__icon--disabled': disabled,
          })}
          onClick={() => {
            if (!disabled) {
              !isAccountMenuOpen &&
                this.context.trackEvent({
                  category: EVENT.CATEGORIES.NAVIGATION,
                  event: 'Opened Main Menu',
                  properties: {
                    action: 'Home',
                    legacy_event: true,
                  },
                });
              toggleAccountMenu();
            }
          }}
        >
          <Identicon address={selectedAddress} diameter={32} addBorder />
          {
            ///: BEGIN:ONLY_INCLUDE_IN(flask)
            unreadNotificationsCount > 0 && (
              <div className="account-menu__icon__notification-count">
                {unreadNotificationsCount}
              </div>
            )
            ///: END:ONLY_INCLUDE_IN
          }
        </button>
      )
    );
  }

  render() {
    const {
      history,
      hideNetworkIndicator,
      disableNetworkIndicator,
      disabled,
      onClick,
    } = this.props;

    return (
      <div className="app-header">
        <div className="app-header__contents">
          <MetaFoxLogo
            unsetIconHeight
            onClick={async () => {
              if (onClick) {
                await onClick();
              }
              history.push(DEFAULT_ROUTE);
            }}
          />
          <div className="app-header__account-menu-container">
            {!hideNetworkIndicator && (
              <div className="app-header__network-component-wrapper">
                <NetworkDisplay
                  onClick={(event) => this.handleNetworkIndicatorClick(event)}
                  disabled={disabled || disableNetworkIndicator}
                />
              </div>
            )}
            {this.renderAccountMenu()}
          </div>
        </div>
      </div>
    );
  }
}
