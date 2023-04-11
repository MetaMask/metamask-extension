import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { findKey } from 'lodash';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import ColorIndicator from '../../ui/color-indicator';
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

  let indicatorType = ColorIndicator.TYPES.OUTLINE;
  let indicatorColor = Color.iconDefault;
  let globalMenuColor = Color.iconAlternative;

  if (status === STATUS_CONNECTED) {
    indicatorColor = Color.successDefault;
    indicatorType = ColorIndicator.TYPES.PARTIAL;
    globalMenuColor = Color.successDefault;
  } else if (status === STATUS_CONNECTED_TO_ANOTHER_ACCOUNT) {
    indicatorColor = Color.errorDefault;
    globalMenuColor = BackgroundColor.backgroundDefault;
  }

  const text =
    status === STATUS_CONNECTED
      ? t('statusConnected')
      : t('statusNotConnected'); // TODO: Remove text since we only need the tooltip text for new permission icon
  const tooltipText =
    status === STATUS_CONNECTED
      ? t('tooltipSatusConnected')
      : t('tooltipSatusNotConnected');
  return (
    <button className="connected-status-indicator" onClick={onClick}>
      {process.env.MULTICHAIN ? (
        <MultichainConnectedSiteMenu
          status={status}
          globalMenuColor={globalMenuColor}
          text={tooltipText}
        />
      ) : (
        <>
          <ColorIndicator color={indicatorColor} type={indicatorType} />
          <div className="connected-status-indicator__text">{text}</div>
        </>
      )}
    </button>
  );
}

ConnectedStatusIndicator.defaultProps = {
  onClick: undefined,
};

ConnectedStatusIndicator.propTypes = {
  onClick: PropTypes.func,
};
