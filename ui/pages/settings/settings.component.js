import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route, matchPath } from 'react-router-dom';
import classnames from 'classnames';
import TabBar from '../../components/app/tab-bar';
import IconCaretLeft from '../../components/ui/icon/icon-caret-left';

import {
  ALERTS_ROUTE,
  ADVANCED_ROUTE,
  SECURITY_ROUTE,
  GENERAL_ROUTE,
  ABOUT_US_ROUTE,
  SETTINGS_ROUTE,
  NETWORKS_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  SNAPS_VIEW_ROUTE,
  SNAPS_LIST_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  CONTACT_LIST_ROUTE,
  CONTACT_ADD_ROUTE,
  CONTACT_EDIT_ROUTE,
  CONTACT_VIEW_ROUTE,
  EXPERIMENTAL_ROUTE,
  ADD_NETWORK_ROUTE,
  ADD_POPULAR_CUSTOM_NETWORK,
} from '../../helpers/constants/routes';

import { getSettingsRoutes } from '../../helpers/utils/settings-search';
import AddNetwork from '../../components/app/add-network/add-network';
import SettingsTab from './settings-tab';
import AlertsTab from './alerts-tab';
import NetworksTab from './networks-tab';
import AdvancedTab from './advanced-tab';
import InfoTab from './info-tab';
import SecurityTab from './security-tab';
import ContactListTab from './contact-list-tab';
import ExperimentalTab from './experimental-tab';
///: BEGIN:ONLY_INCLUDE_IN(flask)
import SnapListTab from './flask/snaps-list-tab';
import ViewSnap from './flask/view-snap';
///: END:ONLY_INCLUDE_IN
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
    isSnapViewPage: PropTypes.bool,
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
      isSnapViewPage,
    } = this.props;

    const { searchResults, isSearchList, searchText } = this.state;

    return (
      <div
        className={classnames('main-container settings-page', {
          'settings-page--selected': currentPath !== SETTINGS_ROUTE,
        })}
      >
        <div className="settings-page__header">
          <div className="settings-page__header__title-container">
            {currentPath !== SETTINGS_ROUTE && (
              <IconCaretLeft
                className="settings-page__back-button"
                color="var(--color-icon-default)"
                size={32}
                onClick={() => history.push(backRoute)}
              />
            )}

            {this.renderTitle()}
            <div
              className="settings-page__header__title-container__close-button"
              onClick={() => {
                if (addNewNetwork) {
                  history.push(NETWORKS_ROUTE);
                } else {
                  history.push(mostRecentOverviewPage);
                }
              }}
            />
          </div>

          <div className="settings-page__header__search">
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
          </div>
        </div>

        <div className="settings-page__content">
          <div className="settings-page__content__tabs">
            {this.renderTabs()}
          </div>
          <div className="settings-page__content__modules">
            {isSnapViewPage ? null : this.renderSubHeader()}
            {this.renderContent()}
          </div>
        </div>
      </div>
    );
  }

  renderTitle() {
    const { t } = this.context;
    const { isPopup, pathnameI18nKey, addressName, isSnapViewPage } =
      this.props;
    let titleText;
    if (isSnapViewPage) {
      titleText = t('snaps');
    } else if (isPopup && addressName) {
      titleText = t('details');
    } else if (pathnameI18nKey && isPopup) {
      titleText = t(pathnameI18nKey);
    } else {
      titleText = t('settings');
    }

    return (
      <div className="settings-page__header__title-container__title">
        {titleText}
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
        <div className="settings-page__subheader">
          <div
            className={classnames({
              'settings-page__subheader--link': initialBreadCrumbRoute,
            })}
            onClick={() =>
              initialBreadCrumbRoute && history.push(initialBreadCrumbRoute)
            }
          >
            {subheaderText}
          </div>
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
        </div>
      )
    );
  }

  renderTabs() {
    const { history, currentPath } = this.props;
    const { t } = this.context;

    return (
      <TabBar
        tabs={[
          {
            content: t('general'),
            icon: <i className="fa fa-cog" />,
            key: GENERAL_ROUTE,
          },
          {
            content: t('advanced'),
            icon: <i className="fas fa-sliders-h" />,
            key: ADVANCED_ROUTE,
          },
          {
            content: t('contacts'),
            icon: <i className="fa fa-address-book" />,
            key: CONTACT_LIST_ROUTE,
          },
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          {
            content: t('snaps'),
            icon: (
              <i
                className="fa fa-flask"
                title={t('snapsSettingsDescription')}
              />
            ),
            key: SNAPS_LIST_ROUTE,
          },
          ///: END:ONLY_INCLUDE_IN
          {
            content: t('securityAndPrivacy'),
            icon: <i className="fa fa-lock" />,
            key: SECURITY_ROUTE,
          },
          {
            content: t('alerts'),
            icon: <i className="fa fa-bell" />,
            key: ALERTS_ROUTE,
          },
          {
            content: t('networks'),
            icon: <i className="fa fa-plug" />,
            key: NETWORKS_ROUTE,
          },
          {
            content: t('experimental'),
            icon: <i className="fa fa-flask" />,
            key: EXPERIMENTAL_ROUTE,
          },
          {
            content: t('about'),
            icon: <i className="fa fa-info-circle" />,
            key: ABOUT_US_ROUTE,
          },
        ]}
        isActive={(key) => {
          if (key === GENERAL_ROUTE && currentPath === SETTINGS_ROUTE) {
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
        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          <Route exact path={SNAPS_LIST_ROUTE} component={SnapListTab} />
          ///: END:ONLY_INCLUDE_IN
        }
        {
          ///: BEGIN:ONLY_INCLUDE_IN(flask)
          <Route exact path={`${SNAPS_VIEW_ROUTE}/:id`} component={ViewSnap} />
          ///: END:ONLY_INCLUDE_IN
        }
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
