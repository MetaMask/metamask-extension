import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_NOTIFICATION,
} from '../../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import Identicon from '../../../ui/identicon';
import { shortenAddress } from '../../../../helpers/utils/util';
import AccountMismatchWarning from '../../../ui/account-mismatch-warning/account-mismatch-warning.component';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Icon, IconName, PickerNetwork } from '../../../component-library';
import {
  BackgroundColor,
  BorderColor,
  Display,
} from '../../../../helpers/constants/design-system';
import { getTestNetworkBackgroundColor } from '../../../../selectors';
import { getProviderConfig } from '../../../../ducks/metamask/metamask';
import { NETWORK_TYPES } from '../../../../../shared/constants/network';
import { getNetworkLabelKey } from '../../../../helpers/utils/i18n-helper';

export default function ConfirmPageContainerHeader({
  onEdit,
  showEdit,
  accountAddress,
  showAccountInHeader,
  children,
}) {
  const t = useI18nContext();
  const windowType = getEnvironmentType();
  const { nickname, type: networkType } = useSelector(getProviderConfig);
  const testNetworkBackgroundColor = useSelector(getTestNetworkBackgroundColor);

  const isFullScreen =
    windowType !== ENVIRONMENT_TYPE_NOTIFICATION &&
    windowType !== ENVIRONMENT_TYPE_POPUP;

  if (!showEdit && isFullScreen) {
    return children;
  }
  return (
    <div
      className="confirm-page-container-header"
      data-testid="header-container"
    >
      <div className="confirm-page-container-header__row">
        {showAccountInHeader ? (
          <div className="confirm-page-container-header__address-container">
            <div className="confirm-page-container-header__address-identicon">
              <Identicon address={accountAddress} diameter={24} />
            </div>
            <div
              className="confirm-page-container-header__address"
              data-testid="header-address"
            >
              {shortenAddress(accountAddress)}
            </div>
            <AccountMismatchWarning address={accountAddress} />
          </div>
        ) : (
          <div
            className="confirm-page-container-header__back-button-container"
            style={{
              visibility: showEdit ? 'initial' : 'hidden',
            }}
          >
            <Icon name={IconName.ArrowLeft} />
            <span
              data-testid="confirm-page-back-edit-button"
              className="confirm-page-container-header__back-button"
              onClick={() => onEdit()}
            >
              {t('edit')}
            </span>
          </div>
        )}
        {isFullScreen ? null : (
          <PickerNetwork
            label={
              networkType === NETWORK_TYPES.RPC
                ? nickname ?? t('privateNetwork')
                : t(getNetworkLabelKey(networkType))
            }
            as="div"
            backgroundColor={BackgroundColor.transparent}
            borderColor={BorderColor.borderMuted}
            iconProps={{ display: Display.None }}
            avatarNetworkProps={{
              backgroundColor: testNetworkBackgroundColor,
              className: 'confirm-page-container-header-avatar-network-base',
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}

ConfirmPageContainerHeader.propTypes = {
  accountAddress: PropTypes.string,
  showAccountInHeader: PropTypes.bool,
  showEdit: PropTypes.bool,
  onEdit: PropTypes.func,
  children: PropTypes.node,
};
