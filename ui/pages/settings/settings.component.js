import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, matchPath } from 'react-router-dom';
import classnames from 'classnames';
import TabBar from '../../components/app/tab-bar';

import {
  ALERTS_ROUTE,
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
  EXPERIMENTAL_ROUTE,
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';

import { getSettingsRoutes } from '../../helpers/utils/settings-search';
import AddNetwork from '../../components/app/add-network/add-network';
import {
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconName,
  Box,
  Text,
} from '../../components/component-library';
import {
  AlignItems,
  Color,
  Display,
  FlexDirection,
  TextVariant,
} from '../../helpers/constants/design-system';
import MetafoxLogo from '../../components/ui/metafox-logo';
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import SettingsTab from './settings-tab';
import AlertsTab from './alerts-tab';
import NetworksTab from './networks-tab';
import AdvancedTab from './advanced-tab';
import InfoTab from './info-tab';
import SecurityTab from './security-tab';
import ContactListTab from './contact-list-tab';
import ExperimentalTab from './experimental-tab';
import SettingsSearch from './settings-search';
import SettingsSearchList from './settings-search-list';

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
    isPopup: PropTypes.bool,
    mostRecentOverviewPage: PropTypes.string.isRequired,
    pathnameI18nKey: PropTypes.string,
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
    } = this.props;

    const { searchResults, isSearchList, searchText } = this.state;
    const { t } = this.context;
    const isPopup = getEnvironmentType() === ENVIRONMENT_TYPE_POPUP;

    return (
      <div
        className={classnames('main-container settings-page', {
          'settings-page--selected': currentPath !== SETTINGS_ROUTE,
        })}
      >
        <Box
          className="settings-page__header"
          padding={4}
          paddingBottom={[2, 4]}
        >
          <div className="settings-page__header__title-container">
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
    const { isPopup, pathnameI18nKey, addressName } = this.props;
    let titleText;
    if (isPopup && addressName) {
      titleText = t('details');
    } else if (pathnameI18nKey && isPopup) {
      titleText = t(pathnameI18nKey);
    } else {
      titleText = t('settings');
    }

    return (
      <div className="settings-page__header__title-container__title">
        <Text variant={TextVariant.headingMd}>{titleText}</Text>
      </div>
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
    const { history, currentPath } = this.props;
    const { t } = this.context;
    const tabs = [
      {
        content: t('general'),
        icon: <Icon name={IconName.Setting} />,
        key: GENERAL_ROUTE,
      },
      {
        content: t('advanced'),
        icon: <i className="fas fa-sliders-h" />,
        key: ADVANCED_ROUTE,
      },
      {
        content: t('contacts'),
        icon: <Icon name={IconName.Book} />,
        key: CONTACT_LIST_ROUTE,
      },
      {
        content: t('securityAndPrivacy'),
        icon: <i className="fa fa-lock" />,
        key: SECURITY_ROUTE,
      },
      {
        content: t('alerts'),
        icon: <Icon name={IconName.Notification} />,
        key: ALERTS_ROUTE,
      },
      {
        content: t('networks'),
        icon: <Icon name={IconName.Plug} />,
        key: NETWORKS_ROUTE,
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
        onSelect={(key) => history.push(key)}
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
        <Route exact path={ABOUT_US_ROUTE} component={InfoTab} />
        <Route exact path={ADVANCED_ROUTE} component={AdvancedTab} />
        <Route exact path={ALERTS_ROUTE} component={AlertsTab} />
        <Route
          exact
          path={ADD_NETWORK_ROUTE}
          render={() => <NetworksTab addNewNetwork />}
        />
        <Route
          exact
          path={NETWORKS_ROUTE}
          render={() => <NetworksTab addNewNetwork={false} />}
        />
        <Route
          exact
          path={ADD_POPULAR_CUSTOM_NETWORK}
          render={() => <AddNetwork />}
        />
        <Route exact path={SECURITY_ROUTE} component={SecurityTab} />
        <Route exact path={EXPERIMENTAL_ROUTE} component={ExperimentalTab} />
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
