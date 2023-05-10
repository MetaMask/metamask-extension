import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Identicon from '../../ui/identicon';
import MetaFoxLogo from '../../ui/metafox-logo';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import NetworkDisplay from '../network-display';

///: BEGIN:ONLY_INCLUDE_IN(build-beta)
import BetaHeader from '../beta-header';
///: END:ONLY_INCLUDE_IN

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
    ///: BEGIN:ONLY_INCLUDE_IN(snaps)
    unreadNotificationsCount: PropTypes.number,
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(desktop)
    desktopEnabled: PropTypes.bool,
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(build-beta)
    showBetaHeader: PropTypes.bool,
    ///: END:ONLY_INCLUDE_IN
    onClick: PropTypes.func,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    custodianIcon: PropTypes.string,
    ///: END:ONLY_INCLUDE_IN
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
        category: MetaMetricsEventCategory.Navigation,
        event: MetaMetricsEventName.NavNetworkMenuOpened,
        properties: {},
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
      ///: BEGIN:ONLY_INCLUDE_IN(snaps)
      unreadNotificationsCount,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    return (
      isUnlocked && (
        <button
          data-testid="account-menu-icon"
          className={classnames('account-menu__icon', {
            'account-menu__icon--disabled': disabled,
          })}
          disabled={Boolean(disabled)}
          onClick={() => {
            if (!disabled) {
              !isAccountMenuOpen &&
                this.context.trackEvent({
                  category: MetaMetricsEventCategory.Navigation,
                  event: MetaMetricsEventName.NavMainMenuOpened,
                  properties: {},
                });
              toggleAccountMenu();
            }
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: '1px solid var(--color-text-alternative)',
            }}
          >
            <Identicon
              address={selectedAddress}
              diameter={32}
              addBorder
              customizedFox="test-string"
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IN(snaps)
              unreadNotificationsCount > 0 && (
                <div className="account-menu__icon__notification-count">
                  {unreadNotificationsCount}
                </div>
              )
              ///: END:ONLY_INCLUDE_IN
            }
          </div>
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
      ///: BEGIN:ONLY_INCLUDE_IN(build-beta)
      showBetaHeader,
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(desktop)
      desktopEnabled,
      ///: END:ONLY_INCLUDE_IN
      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      custodianIcon,
      isUnlocked,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    return (
      <>
        {
          ///: BEGIN:ONLY_INCLUDE_IN(build-beta)
          showBetaHeader ? <BetaHeader /> : null
          ///: END:ONLY_INCLUDE_IN
        }

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
              ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
              custodyImgSrc={custodianIcon}
              isUnlocked={isUnlocked}
              ///: END:ONLY_INCLUDE_IN
            />
            {
              ///: BEGIN:ONLY_INCLUDE_IN(desktop)
              desktopEnabled && process.env.METAMASK_DEBUG && (
                <div data-testid="app-header-desktop-dev-logo">
                  <MetaFoxLogo
                    unsetIconHeight
                    src="./images/logo/desktop.svg"
                  />
                </div>
              )
              ///: END:ONLY_INCLUDE_IN
            }
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
      </>
    );
  }
}
