import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Routes as RouterRoutes,
  Route,
  matchPath,
  Navigate,
} from 'react-router-dom-v5-compat';
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
  TRANSACTION_SHIELD_CLAIM_ROUTES,
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
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { SnapIcon } from '../../components/app/snaps/snap-icon';
import { SnapSettingsRenderer } from '../../components/app/snaps/snap-settings-page';
import PasswordOutdatedModal from '../../components/app/password-outdated-modal';
import ShieldEntryModal from '../../components/app/shield-entry-modal';
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
import ClaimsArea from './transaction-shield-tab/claims-area';
import TransactionShield from './transaction-shield-tab';

// Helper component for network routes that need side effects
const NetworkRouteHandler = ({ onMount }) => {
  React.useEffect(() => {
    onMount();
  }, [onMount]);

  return <Navigate to={{ pathname: DEFAULT_ROUTE }} />;
};

NetworkRouteHandler.propTypes = {
  onMount: PropTypes.func.isRequired,
};

class SettingsPage extends PureComponent {
  static propTypes = {
    addNewNetwork: PropTypes.bool,
    addressName: PropTypes.string,
    backRoute: PropTypes.string,
    conversionDate: PropTypes.number,
    currentPath: PropTypes.string,
    hasSubscribedToShield: PropTypes.bool,
    isAddressEntryPage: PropTypes.bool,
    isMetaMaskShieldFeatureEnabled: PropTypes.bool,
    isPasswordChangePage: PropTypes.bool,
    isPopup: PropTypes.bool,
    isRevealSrpListPage: PropTypes.bool,
    isSeedlessPasswordOutdated: PropTypes.bool,
    isTransactionShieldPage: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    navigate: PropTypes.func.isRequired,
    pathnameI18nKey: PropTypes.string,
    settingsPageSnaps: PropTypes.array,
    shouldShowShieldEntryModal: PropTypes.bool,
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
    showShieldEntryModal: false,
  };

  componentDidMount() {
    this.handleConversionDate();

    if (this.props.shouldShowShieldEntryModal) {
      // if user has subscribed to shield, navigate to shield page
      // otherwise, show shield entry modal
      if (this.props.hasSubscribedToShield) {
        // componentDidMount is rendered after useEffect() so we need setTimeout to ensure the navigation work
        // TODO: use navigate normally when refactor ot use functional component
        setTimeout(() => {
          this.props.navigate(TRANSACTION_SHIELD_ROUTE);
        });
      } else {
        this.setState({ showShieldEntryModal: true });
      }
    }
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
    const { navigate } = this.props;
    navigate(setting.route);
    this.setState({
      isSearchList: '',
      searchResults: '',
    });
  }

  render() {
    const {
      navigate,
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
    const environmentType = getEnvironmentType();
    const isPopup =
      environmentType === ENVIRONMENT_TYPE_POPUP ||
      environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
    const isSidepanel = environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
    const isSearchHidden =
      isRevealSrpListPage || isPasswordChangePage || isTransactionShieldPage;

    return (
      <div
        className={classnames(
          'main-container main-container--has-shadow settings-page',
          {
            'settings-page--selected': currentPath !== SETTINGS_ROUTE,
            'settings-page--sidepanel': isSidepanel,
          },
        )}
      >
        {this.state.showShieldEntryModal && (
          <ShieldEntryModal
            skipEventSubmission
            onClose={() => this.setState({ showShieldEntryModal: false })}
          />
        )}
        {isSeedlessPasswordOutdated && <PasswordOutdatedModal />}
        <Box className="settings-page__header" padding={4} paddingBottom={2}>
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
                    onClick={() => navigate(DEFAULT_ROUTE)}
                    display={[Display.Flex, Display.None]}
                  />
                ) : (
                  <ButtonIcon
                    ariaLabel={t('back')}
                    iconName={IconName.ArrowLeft}
                    className="settings-page__header__title-container__back-button"
                    color={Color.iconDefault}
                    onClick={() => navigate(backRoute)}
                    display={[Display.Flex, Display.None]}
                    size={ButtonIconSize.Md}
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
                  navigate(NETWORKS_ROUTE);
                } else {
                  navigate(mostRecentOverviewPage);
                }
              }}
              size={ButtonIconSize.Md}
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
      backRoute,
      navigate,
    } = this.props;
    let subheaderText;

    if (isPopup && isAddressEntryPage) {
      subheaderText = t('settings');
    } else if (isAddressEntryPage) {
      subheaderText = t('contacts');
    } else {
      subheaderText = t(pathnameI18nKey || 'general');
    }

    // Show back button only on inner pages of the settings page
    const showBackButton = backRoute !== SETTINGS_ROUTE;

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
          {showBackButton && (
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              onClick={() => navigate(backRoute)}
              marginRight={2}
              size={ButtonIconSize.Md}
            />
          )}
          <Text variant={TextVariant.headingSm}>{subheaderText}</Text>
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
      navigate,
      currentPath,
      useExternalServices,
      settingsPageSnaps,
      isMetaMaskShieldFeatureEnabled,
      hasSubscribedToShield,
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

    if (isMetaMaskShieldFeatureEnabled && useExternalServices) {
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
          return matchPath(key, currentPath);
        }}
        onSelect={(key) => {
          if (key === TRANSACTION_SHIELD_ROUTE && !hasSubscribedToShield) {
            this.setState({ showShieldEntryModal: true });
            return;
          }
          navigate(key);
        }}
      />
    );
  }

  renderContent() {
    return (
      <RouterRoutes>
        <Route
          path={GENERAL_ROUTE}
          element={
            <SettingsTab
              lastFetchedConversionDate={this.state.lastFetchedConversionDate}
            />
          }
        />
        <Route path={ABOUT_US_ROUTE} element={<InfoTab />} />
        <Route
          path={`${SNAP_SETTINGS_ROUTE}/:snapId`}
          element={<SnapSettingsRenderer />}
        />
        <Route path={ADVANCED_ROUTE} element={<AdvancedTab />} />
        <Route path={BACKUPANDSYNC_ROUTE} element={<BackupAndSyncTab />} />
        <Route
          path={ADD_NETWORK_ROUTE}
          element={
            <NetworkRouteHandler
              onMount={() =>
                this.props.toggleNetworkMenu({ isAddingNewNetwork: true })
              }
            />
          }
        />
        <Route
          path={NETWORKS_ROUTE}
          element={
            <NetworkRouteHandler
              onMount={() => this.props.toggleNetworkMenu()}
            />
          }
        />
        <Route
          path={ADD_POPULAR_CUSTOM_NETWORK}
          element={
            <NetworkRouteHandler
              onMount={() => this.props.toggleNetworkMenu()}
            />
          }
        />
        <Route path={SECURITY_ROUTE} element={<SecurityTab />} />
        <Route
          path={TRANSACTION_SHIELD_ROUTE}
          element={<TransactionShield />}
        />
        <Route
          path={`${TRANSACTION_SHIELD_CLAIM_ROUTES.BASE}/*`}
          element={<ClaimsArea />}
        />
        <Route path={EXPERIMENTAL_ROUTE} element={<ExperimentalTab />} />
        {(process.env.ENABLE_SETTINGS_PAGE_DEV_OPTIONS ||
          process.env.IN_TEST) && (
          <Route
            path={DEVELOPER_OPTIONS_ROUTE}
            element={<DeveloperOptionsTab />}
          />
        )}
        <Route path={CONTACT_LIST_ROUTE} element={<ContactListTab />} />
        <Route path={CONTACT_ADD_ROUTE} element={<ContactListTab />} />
        <Route
          path={`${CONTACT_EDIT_ROUTE}/:id`}
          element={<ContactListTab />}
        />
        <Route
          path={`${CONTACT_VIEW_ROUTE}/:id`}
          element={<ContactListTab />}
        />
        <Route path={REVEAL_SRP_LIST_ROUTE} element={<RevealSrpList />} />
        <Route
          path={SECURITY_PASSWORD_CHANGE_ROUTE}
          element={<ChangePassword />}
        />
        <Route
          path="*"
          element={
            <SettingsTab
              lastFetchedConversionDate={this.state.lastFetchedConversionDate}
            />
          }
        />
      </RouterRoutes>
    );
  }
}

export default SettingsPage;
