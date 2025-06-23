import React from 'react';
import { useSelector } from 'react-redux';
import { isInternalAccountInPermittedAccountIds } from '@metamask/chain-agnostic-permission';
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BadgeStatus } from '../badge-status';
import {
  getAllPermittedAccountsForCurrentTab,
  getInternalAccountByAddress,
} from '../../../selectors';

export type ConnectedStatusProps = {
  address: string;
  isActive?: boolean;
  showConnectedStatus?: boolean;
};

export type AddressConnectedSubjectMap = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [address: string]: any;
};

export const ConnectedStatus: React.FC<ConnectedStatusProps> = ({
  address = '',
  isActive,
  showConnectedStatus = true,
}): JSX.Element => {
  const t = useI18nContext();

  // Get the permitted accounts and the internal account for the address
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const internalAccount = useSelector((state) =>
    getInternalAccountByAddress(state, address),
  );

  const currentTabIsConnectedToSelectedAddress =
    internalAccount &&
    isInternalAccountInPermittedAccountIds(internalAccount, permittedAccounts);

  let status = STATUS_NOT_CONNECTED;
  if (isActive) {
    status = STATUS_CONNECTED;
  } else if (currentTabIsConnectedToSelectedAddress) {
    status = STATUS_CONNECTED_TO_ANOTHER_ACCOUNT;
  }

  let badgeBorderColor = BorderColor.backgroundDefault; // TODO: Replace it once border-color has this value.
  let badgeBackgroundColor = BackgroundColor.iconAlternative;
  let tooltipText = t('statusNotConnected');
  if (status === STATUS_CONNECTED) {
    badgeBorderColor = BorderColor.backgroundDefault;
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
      showConnectedStatus={showConnectedStatus}
    />
  );
};
