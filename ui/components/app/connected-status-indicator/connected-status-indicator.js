import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { findKey } from 'lodash';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
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
  getPermissionsForActiveTab,
  getSelectedAddress,
} from '../../../selectors';
import { ConnectedSiteMenu } from '../../multichain';

export default function ConnectedStatusIndicator({ onClick }) {
  const t = useI18nContext();

  const selectedAddress = useSelector(getSelectedAddress);

  const permissionsForActiveTab = useSelector(getPermissionsForActiveTab);

  const activeWalletSnap = permissionsForActiveTab
    .map((permission) => permission.key)
    .includes(WALLET_SNAP_PERMISSION_KEY);

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
  } else if (activeWalletSnap) {
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
