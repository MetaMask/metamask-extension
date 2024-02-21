import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-rpc-methods';
import {
  BackgroundColor,
  BorderColor,
  Color,
} from '../../../helpers/constants/design-system';
import {
  getAddressConnectedSubjectMap,
  getOriginOfCurrentTab,
  getPermissionsForActiveTab,
} from '../../../selectors';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_CONNECTED_TO_SNAP,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BadgeStatus } from '../badge-status';

export const ConnectedStatus = ({ address = '', isActive = false }) => {
  const t = useSelector(useI18nContext);

  const addressConnectedSubjectMap = useSelector(getAddressConnectedSubjectMap);
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);

  const selectedAddressSubjectMap = addressConnectedSubjectMap[address];
  const currentTabIsConnectedToSelectedAddress = Boolean(
    selectedAddressSubjectMap && selectedAddressSubjectMap[originOfCurrentTab],
  );

  let status;
  if (isActive) {
    status = STATUS_CONNECTED;
  } else if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  } else {
    status = STATUS_NOT_CONNECTED;
  }

  let badgeBorderColor = BackgroundColor.backgroundDefault;
  let badgeBackgroundColor = Color.borderMuted;
  let tooltipText = t('statusNotConnected');
  if (status === STATUS_CONNECTED) {
    badgeBorderColor = BackgroundColor.backgroundDefault;
    badgeBackgroundColor = BackgroundColor.successDefault;
    tooltipText = t('active');
  } else if (status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT) {
    badgeBorderColor = BorderColor.successDefault;
    badgeBackgroundColor = BackgroundColor.backgroundDefault;
    tooltipText = t('tooltipSatusConnectedUpperCase');
  }

  const connectedAndNotActive =
    currentTabIsConnectedToSelectedAddress && !isActive;

  return (
    <BadgeStatus
      address={address}
      badgeBackgroundColor={badgeBackgroundColor}
      badgeBorderColor={badgeBorderColor}
      text={tooltipText}
      isConnectedAndNotActive={connectedAndNotActive}
    />
  );
};

ConnectedStatus.propTypes = {
  /**
   * Address for AvatarAccount
   */
  address: PropTypes.string.isRequired,
  /**
   * Boolean to determine active status
   */
  isActive: PropTypes.bool,
};
