import React from 'react';
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
  getConnectedSubjectsForAllAddresses,
  getSnapsList,
} from '../../../../selectors';
import { Tab, Tabs } from '../../../ui/tabs';
import { ConnectionListItem } from './connection-list-item';

export const AllConnections = () => {
  const t = useI18nContext();
  const history = useHistory();
  const TABS_THRESHOLD = 5;
  let totalConnections = 0;
  const connectedSubjectsForAllAddresses = useSelector(
    getConnectedSubjectsForAllAddresses,
  );
  const connectedAddresses = Object.keys(connectedSubjectsForAllAddresses);
  const connectedSiteData = {};
  connectedAddresses.forEach((connectedAddress) => {
    connectedSubjectsForAllAddresses[connectedAddress].forEach((app) => {
      if (!connectedSiteData[app.origin]) {
        connectedSiteData[app.origin] = { ...app, addresses: [] };
      }
      connectedSiteData[app.origin].addresses.push(connectedAddress);
    });
  });

  const sitesConnectionsList = {};
  Object.keys(connectedSiteData).forEach((siteKey) => {
    const siteData = connectedSiteData[siteKey];
    const { name, iconUrl, origin, subjectType, extensionId, addresses } =
      siteData;

    if (!sitesConnectionsList[name]) {
      sitesConnectionsList[name] = {
        name,
        iconUrl,
        origin,
        subjectType,
        extensionId,
        addresses: [],
      };
      totalConnections += 1;
    }

    sitesConnectionsList[name].addresses.push(...addresses);
  });

  const snapsConnectionsList = {};
  const connectedSnapsData = useSelector((state) => getSnapsList(state));
  Object.keys(connectedSnapsData).forEach((snap) => {
    const snapData = connectedSnapsData[snap];
    const { id, name, packageName, iconUrl, subjectType } = snapData;

    if (!snapsConnectionsList[name]) {
      snapsConnectionsList[name] = {
        id,
        name,
        iconUrl,
        packageName,
        subjectType,
      };
      totalConnections += 1;
    }
  });

  const shouldShowTabsView =
    totalConnections > TABS_THRESHOLD &&
    Object.keys(sitesConnectionsList).length > 0 &&
    Object.keys(snapsConnectionsList).length > 0;

  const handleConnectionClick = (connection) => {
    // TODO: go to connection details page
    console.log('connection clicked: ', connection);
  };
  return (
    <Page
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
          <Tab name={t('sites')} tabKey="sites">
            {Object.keys(sitesConnectionsList).map((itemKey) => {
              const connection = sitesConnectionsList[itemKey];
              return (
                <ConnectionListItem
                  key={itemKey}
                  connection={connection}
                  onClick={() => handleConnectionClick(connection)}
                />
              );
            })}
          </Tab>
          <Tab name={t('snaps')} tabKey="snaps">
            {Object.keys(snapsConnectionsList).map((itemKey) => {
              const connection = snapsConnectionsList[itemKey];
              return (
                <ConnectionListItem
                  key={itemKey}
                  connection={connection}
                  onClick={() => handleConnectionClick(connection)}
                />
              );
            })}
          </Tab>
        </Tabs>
      ) : (
        <>
          {' '}
          {Object.keys(sitesConnectionsList).length > 0 && (
            <>
              <Text
                backgroundColor={BackgroundColor.backgroundDefault}
                variant={TextVariant.bodyLgMedium}
                textAlign={TextAlign.Center}
                padding={4}
              >
                {t('siteConnections')}
              </Text>
              {Object.keys(sitesConnectionsList).map((itemKey) => {
                const connection = sitesConnectionsList[itemKey];
                return (
                  <ConnectionListItem
                    key={itemKey}
                    connection={connection}
                    onClick={() => handleConnectionClick(connection)}
                  />
                );
              })}
            </>
          )}
          {Object.keys(snapsConnectionsList).length > 0 && (
            <>
              <Text
                variant={TextVariant.bodyLgMedium}
                backgroundColor={BackgroundColor.backgroundDefault}
                textAlign={TextAlign.Center}
                padding={4}
              >
                {t('snapConnections')}
              </Text>
              {Object.keys(snapsConnectionsList).map((itemKey) => {
                const connection = snapsConnectionsList[itemKey];
                return (
                  <ConnectionListItem
                    key={itemKey}
                    connection={connection}
                    onClick={() => handleConnectionClick(connection)}
                  />
                );
              })}
            </>
          )}
        </>
      )}
      {totalConnections === 0 && (
        <Text
          variant={TextVariant.bodyLgMedium}
          backgroundColor={BackgroundColor.backgroundDefault}
          textAlign={TextAlign.Center}
          padding={4}
        >
          {/* TODO: get copy for this edge case */}
          No Connected Sites or Snaps
        </Text>
      )}
    </Page>
  );
};
