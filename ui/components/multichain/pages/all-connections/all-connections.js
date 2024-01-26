import React, { useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Header, Page } from '../page';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  Color,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import {
  getAllConnectedAccounts,
  getConnectedSubjectsForAllAddresses,
  getSnapsList,
} from '../../../../selectors';
import { Tab, Tabs } from '../../../ui/tabs';
import { ConnectionListItem } from './connection-list-item';

const TABS_THRESHOLD = 5;

export const AllConnections = () => {
  const t = useI18nContext();
  const history = useHistory();
  let totalConnections = 0;
  const connectedSubjectsForAllAddresses = useSelector(
    getConnectedSubjectsForAllAddresses,
  );
  const connectedAddresses = useSelector(getAllConnectedAccounts);
  const connectedSnapsData = useSelector(getSnapsList);

  const connectedSiteData = useMemo(() => {
    const siteData = {};
    connectedAddresses.forEach((connectedAddress) => {
      connectedSubjectsForAllAddresses[connectedAddress].forEach((app) => {
        if (!siteData[app.origin]) {
          siteData[app.origin] = { ...app, addresses: [] };
        }
        siteData[app.origin].addresses.push(connectedAddress);
      });
    });
    return siteData;
  }, [connectedAddresses, connectedSubjectsForAllAddresses]);

  const sitesConnectionsList = useMemo(() => {
    const sitesList = {};
    Object.keys(connectedSiteData).forEach((siteKey) => {
      const siteData = connectedSiteData[siteKey];
      const { name, iconUrl, origin, subjectType, extensionId, addresses } =
        siteData;

      if (!sitesList[name]) {
        sitesList[name] = {
          name,
          iconUrl,
          origin,
          subjectType,
          extensionId,
          addresses: [],
        };
        totalConnections += 1;
      }

      sitesList[name].addresses.push(...addresses);
    });
    return sitesList;
  }, [connectedSiteData]);

  const snapsConnectionsList = useMemo(() => {
    const snapsList = {};
    Object.keys(connectedSnapsData).forEach((snap) => {
      const snapData = connectedSnapsData[snap];
      const { id, name, packageName, iconUrl, subjectType } = snapData;

      if (!snapsList[name]) {
        snapsList[name] = {
          id,
          name,
          iconUrl,
          packageName,
          subjectType,
        };
        totalConnections += 1;
      }
    });
    return snapsList;
  }, [connectedSnapsData]);

  const shouldShowTabsView = useMemo(() => {
    return (
      totalConnections > TABS_THRESHOLD &&
      Object.keys(sitesConnectionsList).length > 0 &&
      Object.keys(snapsConnectionsList).length > 0
    );
  }, [totalConnections, sitesConnectionsList, snapsConnectionsList]);

  const handleConnectionClick = useCallback((connection) => {
    // TODO: go to connection details page
    console.log('connection clicked: ', connection);
  }, []);

  const renderConnectionsList = (connectionList) =>
    Object.entries(connectionList).map(([itemKey, connection]) => {
      return (
        <ConnectionListItem
          data-testid="connection-list-item"
          key={itemKey}
          connection={connection}
          onClick={() => handleConnectionClick(connection)}
        />
      );
    });

  return (
    <Page
      data-testid="all-connections"
      header={
        <Header
          backgroundColor={BackgroundColor.backgroundDefault}
          startAccessory={
            <ButtonIcon
              ariaLabel={t('back')}
              iconName={IconName.ArrowLeft}
              className="connections-header__start-accessory"
              color={Color.iconDefault}
              onClick={() => history.push(DEFAULT_ROUTE)}
              size={ButtonIconSize.Sm}
            />
          }
        >
          <Text
            as="span"
            variant={TextVariant.headingMd}
            textAlign={TextAlign.Center}
          >
            {t('allConnections')}
          </Text>
        </Header>
      }
    >
      {shouldShowTabsView ? (
        <Tabs tabsClassName="all-connections__tabs">
          <Tab
            data-testid="all-connections-sites-tab"
            name={t('sites')}
            tabKey="sites"
          >
            {renderConnectionsList(sitesConnectionsList)}
          </Tab>
          <Tab
            data-testid="all-connections-snaps-tab"
            name={t('snaps')}
            tabKey="snaps"
          >
            {renderConnectionsList(snapsConnectionsList)}
          </Tab>
        </Tabs>
      ) : (
        <>
          {Object.keys(sitesConnectionsList).length > 0 && (
            <>
              <Text
                data-testid="sites-connections"
                backgroundColor={BackgroundColor.backgroundDefault}
                variant={TextVariant.bodyLgMedium}
                textAlign={TextAlign.Center}
                padding={4}
              >
                {t('siteConnections')}
              </Text>
              {renderConnectionsList(sitesConnectionsList)}
            </>
          )}
          {Object.keys(snapsConnectionsList).length > 0 && (
            <>
              <Text
                data-testid="snaps-connections"
                variant={TextVariant.bodyLgMedium}
                backgroundColor={BackgroundColor.backgroundDefault}
                textAlign={TextAlign.Center}
                padding={4}
              >
                {t('snapConnections')}
              </Text>
              {renderConnectionsList(snapsConnectionsList)}
            </>
          )}
        </>
      )}
      {totalConnections === 0 ? (
        <Text
          data-testid="no-connections"
          variant={TextVariant.bodyLgMedium}
          backgroundColor={BackgroundColor.backgroundDefault}
          textAlign={TextAlign.Center}
          padding={4}
        >
          {/* TODO: get copy for this edge case */}
          No Connected Sites or Snaps
        </Text>
      ) : null}
    </Page>
  );
};
