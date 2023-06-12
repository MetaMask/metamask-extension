import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { findKey } from 'lodash';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
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
} from '../../../selectors';
import { MultichainConnectedSiteMenu } from '../../multichain';

export default function ConnectedStatusIndicator({ onClick }) {
  const t = useI18nContext();

  const selectedAddress = useSelector(getSelectedAddress);
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
  } else {
    status = STATUS_NOT_CONNECTED;
  }

  let globalMenuColor = Color.iconAlternative;
  if (status === STATUS_CONNECTED) {
    globalMenuColor = Color.successDefault;
  } else if (status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT) {
    globalMenuColor = BackgroundColor.backgroundDefault;
  }

  const tooltipText =
    status === STATUS_CONNECTED
      ? t('tooltipSatusConnected')
      : t('tooltipSatusNotConnected');

  return (
    <MultichainConnectedSiteMenu
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
