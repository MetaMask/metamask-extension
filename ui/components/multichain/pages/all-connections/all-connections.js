import React from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Header, Page } from '../page';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Color } from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';
import {
  getConnectedSubjectsForAllAddresses,
  getSnapsList,
} from '../../../../selectors';
import { ConnectionListItem } from './connection-list-item';

export const AllConnections = () => {
  const t = useI18nContext();
  const history = useHistory();
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

  const allConnectionsList = {};
  const allSnapsList = {};
  const connectedSnapsData = useSelector((state) => getSnapsList(state));

  Object.keys(connectedSiteData).forEach((siteKey) => {
    const siteData = connectedSiteData[siteKey];
    const { name, iconUrl, origin, subjectType, extensionId, addresses } =
      siteData;

    if (!allConnectionsList[name]) {
      allConnectionsList[name] = {
        name,
        iconUrl,
        origin,
        subjectType,
        extensionId,
        addresses: [],
      };
    }

    allConnectionsList[name].addresses.push(...addresses);
  });

  Object.keys(connectedSnapsData).forEach((snap) => {
    const snapData = connectedSnapsData[snap];
    const { id, name, packageName, iconUrl, subjectType } = snapData;

    if (!allSnapsList[name]) {
      allSnapsList[name] = {
        id,
        name,
        packageName,
        iconUrl,
        subjectType,
      };
    }
  });

  const handleConnectionClick = (connection) => {
    // TODO: go to connection details page
    console.log('connection clicked: ', connection);
  };
  return (
    <Page
      header={
        <Header
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
          {t('allConnections')}
        </Header>
      }
    >
      {Object.keys(allConnectionsList).map((itemKey) => {
        const connection = allConnectionsList[itemKey];
        return (
          <ConnectionListItem
            key={itemKey}
            connection={connection}
            onClick={() => handleConnectionClick(connection)}
          />
        );
      })}
      Snaps
      {Object.keys(allSnapsList).map((itemKey) => {
        const connection = allSnapsList[itemKey];
        return (
          <ConnectionListItem
            key={itemKey}
            connection={connection}
            onClick={() => handleConnectionClick(connection)}
          />
        );
      })}
    </Page>
  );
};
