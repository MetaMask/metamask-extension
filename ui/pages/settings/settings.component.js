import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, matchPath, Redirect } from 'react-router-dom';
import classnames from 'classnames';
import TabBar from '../../components/app/tab-bar';

import {
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  NETWORKS_ROUTE,
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  DEVELOPER_OPTIONS_ROUTE,
  EXPERIMENTAL_ROUTE,
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
  DEFAULT_ROUTE,
  NOTIFICATIONS_SETTINGS_ROUTE,
  SNAP_SETTINGS_ROUTE,
  REVEAL_SRP_LIST_ROUTE,
  BACKUPANDSYNC_ROUTE,
  SECURITY_PASSWORD_CHANGE_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';

import { getSettingsRoutes } from '../../helpers/utils/settings-search';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  Box,
  Text,
  IconSize,
} from '../../components/component-library';
import {
  AlignItems,
  Color,
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import MetafoxLogo from '../../components/ui/metafox-logo';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { SnapIcon } from '../../components/app/snaps/snap-icon';
import { SnapSettingsRenderer } from '../../components/app/snaps/snap-settings-page';
import PasswordOutdatedModal from '../../components/app/password-outdated-modal';
import SettingsTab from './settings-tab';
import AdvancedTab from './advanced-tab';
import InfoTab from './info-tab';
import SecurityTab from './security-tab';
import ContactListTab from './contact-list-tab';
import DeveloperOptionsTab from './developer-options-tab';
import ExperimentalTab from './experimental-tab';
import SettingsSearch from './settings-search';
import SettingsSearchList from './settings-search-list';
import { RevealSrpList } from './security-tab/reveal-srp-list';
import BackupAndSyncTab from './backup-and-sync-tab';
import ChangePassword from './security-tab/change-password';
import { TransactionShield } from './transaction-shield-tab';

class SettingsPage extends PureComponent {
  static propTypes = {
    addNewNetwork: PropTypes.bool,
    addressName: PropTypes.string,
    backRoute: PropTypes.string,
    breadCrumbTextKey: PropTypes.string,
    conversionDate: PropTypes.number,
    currentPath: PropTypes.string,
    history: PropTypes.object,
    initialBreadCrumbKey: PropTypes.string,
    initialBreadCrumbRoute: PropTypes.string,
    isAddressEntryPage: PropTypes.bool,
    isMetaMaskShieldFeatureEnabled: PropTypes.bool,
    isPasswordChangePage: PropTypes.bool,
    isPopup: PropTypes.bool,
    isRevealSrpListPage: PropTypes.bool,
    isSeedlessPasswordOutdated: PropTypes.bool,
    isTransactionShieldPage: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    pathnameI18nKey: PropTypes.string,
    settingsPageSnaps: PropTypes.array,
    snapSettingsTitle: PropTypes.string,
    toggleNetworkMenu: PropTypes.func.isRequired,
    useExternalServices: PropTypes.bool,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  state = {
    isSearchList: false,
    lastFetchedConversionDate: null,
    searchResults: [],
    searchText: '',
  };

  componentDidMount() {
    this.handleConversionDate();
  }

  componentDidUpdate() {
    this.handleConversionDate();
  }

  handleConversionDate() {
    const { conversionDate } = this.props;
    if (conversionDate !== null) {
      this.setState({ lastFetchedConversionDate: conversionDate });
    }
  }

  handleClickSetting(setting) {
    const { history } = this.props;
    history.push(setting.route);
    this.setState({
      isSearchList: '',
      searchResults: '',
    });
  }

  render() {
    const {
      history,
      backRoute,
      currentPath,
      mostRecentOverviewPage,
      addNewNetwork,
      isPasswordChangePage,
      isRevealSrpListPage,
      isSeedlessPasswordOutdated,
      isTransactionShieldPage,
    } = this.props;

    const { t } = this.context;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;
    const isSearchHidden =
      isRevealSrpListPage || isPasswordChangePage || isTransactionShieldPage;

    return (
      <div
        className={classnames(
          'main-container main-container--has-shadow settings-page',
          {
            'settings-page--selected': currentPath !== SETTINGS_ROUTE,
          },
        )}
      >
        {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
        <Box
          className="settings-page__header"
          padding={4}
          paddingBottom={[2, 4]}
        >
          <div
            className={classnames('settings-page__header__title-container', {
              'settings-page__header__title-container--hide-search':
                isSearchHidden,
            })}
          >
            {isPopup && (
              <>
                {currentPath === SETTINGS_ROUTE ? (
                  <MetafoxLogo
                    className="settings-page__header__title-container__metamask-logo"
                    unsetIconHeight
                    onClick={async () => history.push(DEFAULT_ROUTE)}
                    display={[Display.Flex, Display.None]}
                  />
                ) : (
                  <ButtonIcon
                    ariaLabel={t('back')}
                    iconName={IconName.ArrowLeft}
                    className="settings-page__header__title-container__back-button"
                    color={Color.iconDefault}
                    onClick={() => history.push(backRoute)}
                    display={[Display.Flex, Display.None]}
                    size={ButtonIconSize.Sm}
                  />
                )}
              </>
            )}
            {this.renderTitle()}
            {this.renderSearch()}
            <ButtonIcon
              className="settings-page__header__title-container__close-button"
              iconName={IconName.Close}
              ariaLabel={t('close')}
              onClick={() => {
                if (addNewNetwork) {
                  history.push(NETWORKS_ROUTE);
                } else {
                  history.push(mostRecentOverviewPage);
                }
              }}
              size={ButtonIconSize.Sm}
              marginLeft="auto"
            />
          </div>
        </Box>

        <div className="settings-page__content">
          <div className="settings-page__content__tabs">
            {this.renderTabs()}
          </div>
          <div className="settings-page__content__modules">
            {this.renderSubHeader()}
            {this.renderContent()}
          </div>
        </div>
      </div>
    );
  }

  renderTitle() {
    const { t } = this.context;
    const { isPopup, pathnameI18nKey, addressName, snapSettingsTitle } =
      this.props;
    let titleText;
    if (isPopup && addressName) {
      titleText = t('details');
    } else if (pathnameI18nKey && isPopup) {
      titleText = t(pathnameI18nKey);
    } else if (snapSettingsTitle) {
      titleText = snapSettingsTitle;
    } else {
      titleText = t('settings');
    }

    return (
      <div className="settings-page__header__title-container__title">
        <Text variant={TextVariant.headingMd} ellipsis>
          {titleText}
        </Text>
      </div>
    );
  }

  renderSearch() {
    const { isSearchList, searchText, searchResults } = this.state;
    const {
      isRevealSrpListPage,
      isPasswordChangePage,
      isTransactionShieldPage,
    } = this.props;

    if (
      isRevealSrpListPage ||
      isPasswordChangePage ||
      isTransactionShieldPage
    ) {
      return null;
    }

    return (
      <Box
        className="settings-page__header__title-container__search"
        display={[Display.Block]}
      >
        <SettingsSearch
          onSearch={({ searchQuery = '', results = [] }) => {
            this.setState({
              isSearchList: searchQuery !== '',
              searchResults: results,
              searchText: searchQuery,
            });
          }}
          settingsRoutesList={getSettingsRoutes()}
        />
        {isSearchList && searchText.length >= 3 && (
          <SettingsSearchList
            results={searchResults}
            onClickSetting={(setting) => this.handleClickSetting(setting)}
          />
        )}
      </Box>
    );
  }

  renderSubHeader() {
    const { t } = this.context;
    const {
      currentPath,
      isPopup,
      isAddressEntryPage,
      pathnameI18nKey,
      addressName,
      initialBreadCrumbRoute,
      breadCrumbTextKey,
      history,
      initialBreadCrumbKey,
    } = this.props;

    let subheaderText;

    if (isPopup && isAddressEntryPage) {
      subheaderText = t('settings');
    } else if (isAddressEntryPage) {
      subheaderText = t('contacts');
    } else if (initialBreadCrumbKey) {
      subheaderText = t(initialBreadCrumbKey);
    } else {
      subheaderText = t(pathnameI18nKey || 'general');
    }

    return (
      !currentPath.startsWith(NETWORKS_ROUTE) && (
        <Box
          className="settings-page__subheader"
          padding={4}
          paddingLeft={6}
          paddingRight={6}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
        >
          <Text
            className={classnames({
              'settings-page__subheader--link': initialBreadCrumbRoute,
            })}
            variant={TextVariant.headingSm}
            onClick={() =>
              initialBreadCrumbRoute && history.push(initialBreadCrumbRoute)
            }
          >
            {subheaderText}
          </Text>
          {breadCrumbTextKey && (
            <div className="settings-page__subheader--break">
              <span>{' > '}</span>
              {t(breadCrumbTextKey)}
            </div>
          )}
          {isAddressEntryPage && (
            <div className="settings-page__subheader--break">
              <span>{' > '}</span>
              {addressName}
            </div>
          )}
        </Box>
      )
    );
  }

  renderTabs() {
    const {
      history,
      currentPath,
      useExternalServices,
      settingsPageSnaps,
      isMetaMaskShieldFeatureEnabled,
    } = this.props;
    const { t } = this.context;

    const snapsSettings = settingsPageSnaps.map(({ id, name }) => {
      return {
        content: name,
        icon: (
          <SnapIcon
            snapId={id}
            avatarSize={IconSize.Md}
            style={{ '--size': '20px' }}
          />
        ),
        key: `${SNAP_SETTINGS_ROUTE}/${encodeURIComponent(id)}`,
      };
    });

    const tabs = [
      {
        content: t('general'),
        icon: <Icon name={IconName.Setting} />,
        key: GENERAL_ROUTE,
      },
      ...snapsSettings,
      {
        content: t('advanced'),
        icon: <i className="fas fa-sliders-h" />,
        key: ADVANCED_ROUTE,
      },
      {
        content: t('backupAndSync'),
        icon: <Icon name={IconName.SecurityTime} />,
        key: BACKUPANDSYNC_ROUTE,
      },
      {
        content: t('contacts'),
        icon: <Icon name={IconName.Book} />,
        key: CONTACT_LIST_ROUTE,
      },
      {
        content: t('securityAndPrivacy'),
        icon: <Icon name={IconName.Lock} />,
        key: SECURITY_ROUTE,
      },
      {
        content: t('experimental'),
        icon: <Icon name={IconName.Flask} />,
        key: EXPERIMENTAL_ROUTE,
      },
      {
        content: t('about'),
        icon: <Icon name={IconName.Info} />,
        key: ABOUT_US_ROUTE,
      },
    ];

    if (useExternalServices) {
      tabs.splice(4, 0, {
        content: t('notifications'),
        icon: <Icon name={IconName.Notification} />,
        key: NOTIFICATIONS_SETTINGS_ROUTE,
      });
    }

    if (isMetaMaskShieldFeatureEnabled) {
      tabs.splice(-4, 0, {
        content: t('shieldTx'),
        icon: <Icon name={IconName.ShieldLock} />,
        key: TRANSACTION_SHIELD_ROUTE,
      });
    }

    if (process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS || process.env.IN_TEST) {
      tabs.splice(-1, 0, {
        content: t('developerOptions'),
        icon: <Icon name={IconName.CodeCircle} />,
        key: DEVELOPER_OPTIONS_ROUTE,
      });
    }

    return (
      <TabBar
        tabs={tabs}
        isActive={(key) => {
          if (key === GENERAL_ROUTE && currentPath === SETTINGS_ROUTE) {
            return true;
          }
          if (
            key === CONTACT_LIST_ROUTE &&
            currentPath.includes(CONTACT_LIST_ROUTE)
          ) {
            return true;
          }
          return matchPath(currentPath, { exact: true, path: key });
        }}
        onSelect={(key) =>
          history.push({
            pathname: key,
            state: { fromPage: currentPath },
          })
        }
      />
    );
  }

  renderContent() {
    return (
      <Switch>
        <Route
          exact
          path={GENERAL_ROUTE}
          render={(routeProps) => (
            <SettingsTab
              {...routeProps}
              lastFetchedConversionDate={this.state.lastFetchedConversionDate}
            />
          )}
        />
        <Route exact path={ABOUT_US_ROUTE} render={() => <InfoTab />} />
        <Route
          path={`${SNAP_SETTINGS_ROUTE}/:snapId`}
          component={SnapSettingsRenderer}
        />
        <Route exact path={ADVANCED_ROUTE} component={AdvancedTab} />
        <Route exact path={BACKUPANDSYNC_ROUTE} component={BackupAndSyncTab} />
        <Route
          exact
          path={ADD_NETWORK_ROUTE}
          render={() => {
            this.props.toggleNetworkMenu({ isAddingNewNetwork: true });
            return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
          }}
        />
        <Route
          exact
          path={NETWORKS_ROUTE}
          render={() => {
            this.props.toggleNetworkMenu();
            return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
          }}
        />
        <Route
          exact
          path={ADD_POPULAR_CUSTOM_NETWORK}
          render={() => {
            this.props.toggleNetworkMenu();
            return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
          }}
        />
        <Route exact path={SECURITY_ROUTE} component={SecurityTab} />
        <Route
          exact
          path={TRANSACTION_SHIELD_ROUTE}
          component={TransactionShield}
        />
        <Route exact path={EXPERIMENTAL_ROUTE} component={ExperimentalTab} />
        {(process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS ||
          process.env.IN_TEST) && (
          <Route
            exact
            path={DEVELOPER_OPTIONS_ROUTE}
            component={DeveloperOptionsTab}
          />
        )}
        <Route exact path={CONTACT_LIST_ROUTE} component={ContactListTab} />
        <Route exact path={CONTACT_ADD_ROUTE} component={ContactListTab} />
        <Route
          exact
          path={`${CONTACT_EDIT_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route
          exact
          path={`${CONTACT_VIEW_ROUTE}/:id`}
          component={ContactListTab}
        />
        <Route exact path={REVEAL_SRP_LIST_ROUTE} component={RevealSrpList} />
        <Route
          exact
          path={SECURITY_PASSWORD_CHANGE_ROUTE}
          component={ChangePassword}
        />
        <Route
          render={(routeProps) => (
            <SettingsTab
              {...routeProps}
              lastFetchedConversionDate={this.state.lastFetchedConversionDate}
            />
          )}
        />
      </Switch>
    );
  }
}

export default SettingsPage;
