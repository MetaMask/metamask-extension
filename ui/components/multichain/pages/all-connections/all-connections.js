import React, { useMemo, useCallback } from 'react';
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
    const finalResult = {};
    connectedAddresses.forEach((connectedAddress) => {
      connectedSubjectsForAllAddresses[connectedAddress].forEach((app) => {
        if (!finalResult[app.origin]) {
          finalResult[app.origin] = { ...app, addresses: [] };
        }
        finalResult[app.origin].addresses.push(connectedAddress);
      });
    });
    return finalResult;
  }, [connectedAddresses, connectedSubjectsForAllAddresses]);

  const sitesConnectionsList = useMemo(() => {
    const finalResults = {};
    Object.keys(connectedSiteData).forEach((siteKey) => {
      const siteData = connectedSiteData[siteKey];
      const { name, iconUrl, origin, subjectType, extensionId, addresses } =
        siteData;

      if (!finalResults[name]) {
        finalResults[name] = {
          name,
          iconUrl,
          origin,
          subjectType,
          extensionId,
          addresses: [],
        };
        totalConnections += 1;
      }

      finalResults[name].addresses.push(...addresses);
    });
    return finalResults;
  }, [connectedSiteData]);

  const snapsConnectionsList = useMemo(() => {
    const finalResult = {};
    Object.keys(connectedSnapsData).forEach((snap) => {
      const snapData = connectedSnapsData[snap];
      const { id, name, packageName, iconUrl, subjectType } = snapData;

      if (!finalResult[name]) {
        finalResult[name] = {
          id,
          name,
          iconUrl,
          packageName,
          subjectType,
        };
        totalConnections += 1;
      }
    });
    return finalResult;
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
          key={itemKey}
          connection={connection}
          onClick={() => handleConnectionClick(connection)}
        />
      );
    });

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
            {renderConnectionsList(sitesConnectionsList)}
          </Tab>
          <Tab name={t('snaps')} tabKey="snaps">
            {renderConnectionsList(snapsConnectionsList)}
          </Tab>
        </Tabs>
      ) : (
        <>
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
              {renderConnectionsList(sitesConnectionsList)}
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
              {renderConnectionsList(snapsConnectionsList)}
            </>
          )}
        </>
      )}
      {totalConnections === 0 ? (
        <Text
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
