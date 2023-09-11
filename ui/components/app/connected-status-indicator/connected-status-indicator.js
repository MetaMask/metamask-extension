import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { findKey } from 'lodash';
import { useHistory, useLocation } from 'react-router-dom';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_CONNECTED_TO_SNAP,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getAddressConnectedSubjectMap,
  getOriginOfCurrentTab,
  getSelectedAddress,
  getSnaps,
  getSnapsList,
  getSubjectsWithSnapPermission,
} from '../../../selectors';
import { ConnectedSiteMenu } from '../../multichain';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';

export default function ConnectedStatusIndicator({ onClick }) {
  const t = useI18nContext();
  const history = useHistory();

  const selectedAddress = useSelector(getSelectedAddress);
  const location = useLocation();

  const { pathname } = location;
  const snaps = useSelector(getSnaps);
  const snapsList = useSelector((state) => getSnapsList(state));
  // The snap ID is in URI-encoded form in the last path segment of the URL.
  const decodedSnapId = snapsList.map((snap) => snap.key)[0];
  console.log(decodedSnapId, 'ni');
  const snap = Object.entries(snaps)
    .map(([_, snapState]) => snapState)
    .find((snapState) => snapState.id === decodedSnapId);
  useEffect(() => {
    if (!snap) {
      history.push(DEFAULT_ROUTE);
    }
  }, [history, snap]);
  const connectedSnaps = useSelector((state) =>
    getSubjectsWithSnapPermission(state, snap?.id),
  );
  console.log(connectedSnaps);

  const addressConnectedSubjectMap = useSelector(getAddressConnectedSubjectMap);
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);

  const selectedAddressSubjectMap = addressConnectedSubjectMap[selectedAddress];
  const currentTabIsConnectedToSelectedAddress = Boolean(
    selectedAddressSubjectMap && selectedAddressSubjectMap[originOfCurrentTab],
  );
  let status;
  if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED;
  } else if (findKey(addressConnectedSubjectMap, originOfCurrentTab)) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  } else if (connectedSnaps.length > 0) {
    status = STATUS_CONNECTED_TO_SNAP;
  } else {
    status = STATUS_NOT_CONNECTED;
  }

  let globalMenuColor = Color.iconAlternative;
  if (status === STATUS_CONNECTED) {
    globalMenuColor = Color.successDefault;
  } else if (
    status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT ||
    status === STATUS_CONNECTED_TO_SNAP
  ) {
    globalMenuColor = BackgroundColor.backgroundDefault;
  }

  const tooltipText =
    status === STATUS_CONNECTED
      ? t('tooltipSatusConnected')
      : t('tooltipSatusNotConnected');

  return (
    <ConnectedSiteMenu
      status={status}
      globalMenuColor={globalMenuColor}
      text={tooltipText}
      as="button"
      onClick={onClick}
    />
  );
}

ConnectedStatusIndicator.propTypes = {
  onClick: PropTypes.func,
};
