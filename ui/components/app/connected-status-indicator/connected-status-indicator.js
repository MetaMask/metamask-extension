import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { WALLET_SNAP_PERMISSION_KEY } from '@metamask/snaps-utils';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';
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
  getAllPermittedAccountsForCurrentTab,
  getPermissionsForActiveTab,
  getSelectedInternalAccount,
} from '../../../selectors';
import { ConnectedSiteMenu } from '../../multichain';

export default function ConnectedStatusIndicator({ onClick, disabled }) {
  const t = useI18nContext();

  const selectedAccount = useSelector(getSelectedInternalAccount);

  const permissionsForActiveTab = useSelector(getPermissionsForActiveTab);

  const activeWalletSnap = permissionsForActiveTab
    .map((permission) => permission.key)
    .includes(WALLET_SNAP_PERMISSION_KEY);

  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);

  const currentTabIsConnectedToSelectedAddress =
    selectedAccount &&
    isInternalAccountInPermittedAccountIds(selectedAccount, permittedAccounts);

  let status;
  if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED;
  } else if (permittedAccounts.length > 0) {
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
      disabled={disabled}
    />
  );
}

ConnectedStatusIndicator.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
