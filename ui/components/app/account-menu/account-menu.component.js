import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import classnames from 'classnames';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import { EVENT } from '../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import Identicon from '../../ui/identicon';
import SiteIcon from '../../ui/site-icon';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import {
  PRIMARY,
  SUPPORT_LINK,
  ///: BEGIN:ONLY_INCLUDE_IN(beta,flask)
  SUPPORT_REQUEST_LINK,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/common';
import {
  SETTINGS_ROUTE,
  NEW_ACCOUNT_ROUTE,
  IMPORT_ACCOUNT_ROUTE,
  CONNECT_HARDWARE_ROUTE,
  DEFAULT_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  NOTIFICATIONS_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';
import TextField from '../../ui/text-field';
import IconCheck from '../../ui/icon/icon-check';
import IconSpeechBubbles from '../../ui/icon/icon-speech-bubbles';
import IconConnect from '../../ui/icon/icon-connect';
import IconCog from '../../ui/icon/icon-cog';
import IconPlus from '../../ui/icon/icon-plus';
import IconImport from '../../ui/icon/icon-import';

import Button from '../../ui/button';
import SearchIcon from '../../ui/icon/search-icon';
import KeyRingLabel from './keyring-label';

export function AccountMenuItem(props) {
  const { icon, children, text, subText, className, onClick } = props;

  const itemClassName = classnames('account-menu__item', className, {
    'account-menu__item--clickable': Boolean(onClick),
  });
  return children ? (
    <div className={itemClassName} onClick={onClick}>
      {children}
    </div>
  ) : (
    <button className={itemClassName} onClick={onClick}>
      {icon ? <div className="account-menu__item__icon">{icon}</div> : null}
      {text ? <div className="account-menu__item__text">{text}</div> : null}
      {subText ? (
        <div className="account-menu__item__subtext">{subText}</div>
      ) : null}
    </button>
  );
}

AccountMenuItem.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node,
  text: PropTypes.node,
  subText: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default class AccountMenu extends Component {
  static contextTypes = {
    t: PropTypes.func,
    trackEvent: PropTypes.func,
  };

  static propTypes = {
    shouldShowAccountsSearch: PropTypes.bool,
    accounts: PropTypes.array,
    history: PropTypes.object,
    isAccountMenuOpen: PropTypes.bool,
    keyrings: PropTypes.array,
    lockMetamask: PropTypes.func,
    selectedAddress: PropTypes.string,
    showAccountDetail: PropTypes.func,
    toggleAccountMenu: PropTypes.func,
    addressConnectedSubjectMap: PropTypes.object,
    originOfCurrentTab: PropTypes.string,
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    unreadNotificationsCount: PropTypes.number,
    ///: END:ONLY_INCLUDE_IN
  };

  accountsRef;

  state = {
    shouldShowScrollButton: false,
    searchQuery: '',
  };

  addressFuse = new Fuse([], {
    threshold: 0.55,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    ignoreFieldNorm: true,
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'address', weight: 0.5 },
    ],
  });

  componentDidUpdate(prevProps, prevState) {
    const { isAccountMenuOpen: prevIsAccountMenuOpen } = prevProps;
    const { searchQuery: prevSearchQuery } = prevState;
    const { isAccountMenuOpen } = this.props;
    const { searchQuery } = this.state;

    if (!prevIsAccountMenuOpen && isAccountMenuOpen) {
      this.setShouldShowScrollButton();
      this.resetSearchQuery();
    }

    // recalculate on each search query change
    // whether we can show scroll down button
    if (isAccountMenuOpen && prevSearchQuery !== searchQuery) {
      this.setShouldShowScrollButton();
    }
  }

  renderAccountsSearch() {
    const handleChange = (e) => {
      const val = e.target.value.length > 1 ? e.target.value : '';
      this.setSearchQuery(val);
    };

    const inputAdornment = (
      <InputAdornment
        position="start"
        style={{
          maxHeight: 'none',
          marginRight: 0,
          marginLeft: '8px',
        }}
      >
        <SearchIcon color="var(--color-icon-muted)" />
      </InputAdornment>
    );

    return [
      <TextField
        key="search-text-field"
        id="search-accounts"
        placeholder={this.context.t('searchAccounts')}
        type="text"
        onChange={handleChange}
        startAdornment={inputAdornment}
        fullWidth
        theme="material-white-padded"
      />,
      <div className="account-menu__divider" key="search-divider" />,
    ];
  }

  renderAccounts() {
    const {
      accounts,
      selectedAddress,
      keyrings,
      showAccountDetail,
      addressConnectedSubjectMap,
      originOfCurrentTab,
    } = this.props;
    const { searchQuery } = this.state;

    let filteredIdentities = accounts;
    if (searchQuery) {
      this.addressFuse.setCollection(accounts);
      filteredIdentities = this.addressFuse.search(searchQuery);
    }

    if (filteredIdentities.length === 0) {
      return (
        <p className="account-menu__no-accounts">
          {this.context.t('noAccountsFound')}
        </p>
      );
    }

    return filteredIdentities.map((identity) => {
      const isSelected = identity.address === selectedAddress;

      const simpleAddress = identity.address.substring(2).toLowerCase();

      const keyring = keyrings.find((kr) => {
        return (
          kr.accounts.includes(simpleAddress) ||
          kr.accounts.includes(identity.address)
        );
      });
      const addressSubjects =
        addressConnectedSubjectMap[identity.address] || {};
      const iconAndNameForOpenSubject = addressSubjects[originOfCurrentTab];

      return (
        <button
          className="account-menu__account account-menu__item--clickable"
          onClick={() => {
            this.context.trackEvent({
              category: EVENT.CATEGORIES.NAVIGATION,
              event: 'Switched Account',
              properties: {
                action: 'Main Menu',
                legacy_event: true,
              },
            });
            showAccountDetail(identity.address);
          }}
          key={identity.address}
        >
          <div className="account-menu__check-mark">
            {isSelected ? (
              <IconCheck color="var(--color-success-default)" />
            ) : null}
          </div>
          <Identicon address={identity.address} diameter={24} />
          <div className="account-menu__account-info">
            <div className="account-menu__name">{identity.name || ''}</div>
            <UserPreferencedCurrencyDisplay
              className="account-menu__balance"
              value={identity.balance}
              type={PRIMARY}
            />
          </div>
          <KeyRingLabel keyring={keyring} />
          {iconAndNameForOpenSubject ? (
            <div className="account-menu__icon-list">
              <SiteIcon
                icon={iconAndNameForOpenSubject.icon}
                name={iconAndNameForOpenSubject.name}
                size={32}
              />
            </div>
          ) : null}
        </button>
      );
    });
  }

  resetSearchQuery() {
    this.setSearchQuery('');
  }

  setSearchQuery(searchQuery) {
    this.setState({ searchQuery });
  }

  setShouldShowScrollButton = () => {
    if (!this.accountsRef) {
      return;
    }

    const { scrollTop, offsetHeight, scrollHeight } = this.accountsRef;
    const canScroll = scrollHeight > offsetHeight;
    const atAccountListBottom = scrollTop + offsetHeight >= scrollHeight;
    const shouldShowScrollButton = canScroll && !atAccountListBottom;

    this.setState({ shouldShowScrollButton });
  };

  onScroll = debounce(this.setShouldShowScrollButton, 25);

  handleScrollDown = (e) => {
    e.stopPropagation();

    const { scrollHeight } = this.accountsRef;
    this.accountsRef.scroll({ left: 0, top: scrollHeight, behavior: 'smooth' });

    this.setShouldShowScrollButton();
  };

  renderScrollButton() {
    if (!this.state.shouldShowScrollButton) {
      return null;
    }

    return (
      <div
        className="account-menu__scroll-button"
        onClick={this.handleScrollDown}
      >
        <i className="fa fa-arrow-down" title={this.context.t('scrollDown')} />
      </div>
    );
  }

  render() {
    const { t, trackEvent } = this.context;
    const {
      shouldShowAccountsSearch,
      isAccountMenuOpen,
      toggleAccountMenu,
      lockMetamask,
      history,
      ///: BEGIN:ONLY_INCLUDE_IN(flask)
      unreadNotificationsCount,
      ///: END:ONLY_INCLUDE_IN
    } = this.props;

    if (!isAccountMenuOpen) {
      return null;
    }

    let supportText = t('support');
    let supportLink = SUPPORT_LINK;
    ///: BEGIN:ONLY_INCLUDE_IN(beta,flask)
    supportText = t('needHelpSubmitTicket');
    supportLink = SUPPORT_REQUEST_LINK;
    ///: END:ONLY_INCLUDE_IN

    return (
      <div className="account-menu">
        <div className="account-menu__close-area" onClick={toggleAccountMenu} />
        <AccountMenuItem className="account-menu__header">
          {t('myAccounts')}
          <Button
            className="account-menu__lock-button"
            type="secondary"
            onClick={() => {
              lockMetamask();
              history.push(DEFAULT_ROUTE);
            }}
          >
            {t('lock')}
          </Button>
        </AccountMenuItem>
        <div className="account-menu__divider" />
        <div className="account-menu__accounts-container">
          {shouldShowAccountsSearch ? this.renderAccountsSearch() : null}
          <div
            className="account-menu__accounts"
            onScroll={this.onScroll}
            ref={(ref) => {
              this.accountsRef = ref;
            }}
          >
            {this.renderAccounts()}
          </div>
          {this.renderScrollButton()}
        </div>
        <div className="account-menu__divider" />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            trackEvent({
              category: EVENT.CATEGORIES.NAVIGATION,
              event: 'Clicked Create Account',
              properties: {
                action: 'Main Menu',
                legacy_event: true,
              },
            });
            history.push(NEW_ACCOUNT_ROUTE);
          }}
          icon={<IconPlus color="var(--color-icon-alternative)" />}
          text={t('createAccount')}
        />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            trackEvent({
              category: EVENT.CATEGORIES.NAVIGATION,
              event: 'Clicked Import Account',
              properties: {
                action: 'Main Menu',
                legacy_event: true,
              },
            });
            history.push(IMPORT_ACCOUNT_ROUTE);
          }}
          icon={
            <IconImport
              color="var(--color-icon-alternative)"
              ariaLabel={t('importAccount')}
            />
          }
          text={t('importAccount')}
        />
        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            trackEvent({
              category: EVENT.CATEGORIES.NAVIGATION,
              event: 'Clicked Connect Hardware',
              properties: {
                action: 'Main Menu',
                legacy_event: true,
              },
            });
            if (getEnvironmentType() === ENVIRONMENT_TYPE_POPUP) {
              global.platform.openExtensionInBrowser(CONNECT_HARDWARE_ROUTE);
            } else {
              history.push(CONNECT_HARDWARE_ROUTE);
            }
          }}
          icon={
            <IconConnect
              color="var(--color-icon-alternative)"
              ariaLabel={t('connectHardwareWallet')}
            />
          }
          text={t('connectHardwareWallet')}
        />
        <div className="account-menu__divider" />
        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          <>
            <AccountMenuItem
              onClick={() => {
                toggleAccountMenu();
                history.push(NOTIFICATIONS_ROUTE);
              }}
              icon={
                <div className="account-menu__notifications">
                  <i className="fa fa-bell fa-xl" />
                  {unreadNotificationsCount > 0 && (
                    <div className="account-menu__notifications__count">
                      {unreadNotificationsCount}
                    </div>
                  )}
                </div>
              }
              text={t('notifications')}
            />
            <div className="account-menu__divider" />
          </>
          ///: END:ONLY_INCLUDE_IN
        }
        <AccountMenuItem
          onClick={() => {
            global.platform.openTab({ url: supportLink });
          }}
          icon={
            <IconSpeechBubbles
              color="var(--color-icon-alternative)"
              ariaLabel={supportText}
            />
          }
          text={supportText}
        />

        <AccountMenuItem
          onClick={() => {
            toggleAccountMenu();
            history.push(SETTINGS_ROUTE);
            this.context.trackEvent({
              category: EVENT.CATEGORIES.NAVIGATION,
              event: 'Opened Settings',
              properties: {
                action: 'Main Menu',
                legacy_event: true,
              },
            });
          }}
          icon={
            <IconCog
              color="var(--color-icon-alternative)"
              ariaLabel={t('settings')}
            />
          }
          text={t('settings')}
        />
      </div>
    );
  }
}
