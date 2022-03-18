import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
// import { useSelector } from 'react-redux';
import Identicon from '../../ui/identicon';
// import MetaFoxLogo from '../../ui/metafox-logo';
import AlphaCarbonLogoGradient from '../../ui/alpha-carbon-logo-gradient';
import { DEFAULT_ROUTE, UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import NetworkDisplay from '../network-display';
import MenuIcon from '../../ui/icon/menu-icon.component';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../../shared/constants/app';
// import { getAccountMenuState } from '../../../ducks/metamask/metamask';
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
    onClick: PropTypes.func,
  };

  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
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
      this.context.metricsEvent({
        eventOpts: {
          category: 'Navigation',
          action: 'Home',
          name: 'Opened Network Menu',
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
    } = this.props;
    // const accountMenuState = useSelector(getAccountMenuState);
    // console.log(accountMenuState, 'getAccountMenuState');
    return (
      isUnlocked && (
        <div
          className={classnames('account-menu__icon', {
            'account-menu__icon--disabled': disabled,
          })}
          onClick={() => {
            if (!disabled) {
              !isAccountMenuOpen &&
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Navigation',
                    action: 'Home',
                    name: 'Opened Main Menu',
                  },
                });
              toggleAccountMenu();
            }
          }}
        >
          {/* <Identicon address={selectedAddress} diameter={32} addBorder /> */}
          <MenuIcon />
        </div>
      )
    );
  }

  render() {
    const {
      history,
      isUnlocked,
      isAccountMenuOpen,
      hideNetworkIndicator,
      disableNetworkIndicator,
      disabled,
      onClick,
    } = this.props;
    const pathname = history?.location?.pathname;
    const logoShow = pathname === UNLOCK_ROUTE;

    return (
      <div
        className={classnames('app-header', {
          'app-header--back-drop': isUnlocked,
          'app-header--filter': isAccountMenuOpen && getEnvironmentType() != ENVIRONMENT_TYPE_FULLSCREEN,
        })}
      >
        <div className="app-header__contents">
          {/* <MetaFoxLogo
            unsetIconHeight
            onClick={async () => {
              if (onClick) {
                await onClick();
              }
              history.push(DEFAULT_ROUTE);
            }}
          /> */}
          {!logoShow ? <AlphaCarbonLogoGradient
            unsetIconHeight
            onClick={async () => {
              if (onClick) {
                await onClick();
              }
              history.push(DEFAULT_ROUTE);
            }}
          /> : null}

          <div className="app-header__account-menu-container">
            {!hideNetworkIndicator && (
              <div className='app-header__network-component-wrapper'>
                <NetworkDisplay
                  colored={false}
                  outline
                  iconClassName="app-header__network-down-arrow"
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
