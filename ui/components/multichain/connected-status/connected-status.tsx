import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderColor,
  Color,
} from '../../../helpers/constants/design-system';
import {
  getAddressConnectedSubjectMap,
  getOriginOfCurrentTab,
} from '../../../selectors';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BadgeStatus } from '../badge-status';

export const ConnectedStatus = ({ address = '', isActive = false }) => {
  const t = useSelector(useI18nContext);

  const addressConnectedSubjectMap: any = useSelector(
    getAddressConnectedSubjectMap,
  );
  const originOfCurrentTab = useSelector(getOriginOfCurrentTab);

  const selectedAddressSubjectMap = addressConnectedSubjectMap[address];
  const currentTabIsConnectedToSelectedAddress = Boolean(
    selectedAddressSubjectMap?.[originOfCurrentTab],
  );

  let status;
  if (isActive) {
    status = STATUS_CONNECTED;
  } else if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  } else {
    status = STATUS_NOT_CONNECTED;
  }

  let badgeBorderColor = BackgroundColor.backgroundDefault; // TODO: Replace it once border-color has this value.
  let badgeBackgroundColor = Color.borderMuted; // //TODO: Replace it once Background color has this value.
  let tooltipText = t('statusNotConnected');
  if (status === STATUS_CONNECTED) {
    badgeBorderColor = BackgroundColor.backgroundDefault;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: type 'string' can't be used to index type '{}'
    badgeBackgroundColor = BackgroundColor.successDefault;
    tooltipText = t('active');
  } else if (status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: type 'string' can't be used to index type '{}'
    badgeBorderColor = BorderColor.successDefault;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: type 'string' can't be used to index type '{}'
    badgeBackgroundColor = BackgroundColor.backgroundDefault;
    tooltipText = t('tooltipSatusConnectedUpperCase');
  }

  const connectedAndNotActive =
    currentTabIsConnectedToSelectedAddress && !isActive;

  return (
    <BadgeStatus
      address={address}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: type 'string' can't be used to index type '{}'
      badgeBackgroundColor={badgeBackgroundColor}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore: type 'string' can't be used to index type '{}'
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
