import React from 'react';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BadgeStatus } from '../badge-status';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { isAccountConnectedToPermittedAccounts } from '../../../../app/scripts/lib/multichain/utils';
import { getAllPermittedAccountsForCurrentTab, getInternalAccountByAddress } from '../../../selectors';

const STATUS_CONNECTED = 'connected';
const STATUS_NOT_CONNECTED = 'not_connected';
const STATUS_CONNECTED_TO_ANOTHER_ACCOUNT = 'connected_to_another_account';

export type ConnectedStatusProps = {
  address: string;
  isActive?: boolean;
};

export type AddressConnectedSubjectMap = {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [address: string]: any;
};

export const ConnectedStatus: React.FC<ConnectedStatusProps> = ({
  address = '',
  isActive,
}): JSX.Element => {
  const t = useI18nContext();

  // Get the permitted accounts and the internal account for the address
  const permittedAccounts = useSelector(getAllPermittedAccountsForCurrentTab);
  const internalAccount = useSelector(state =>
    getInternalAccountByAddress(state, address)
  );

  // Use our utility function to check if the account is connected
  const currentTabIsConnectedToSelectedAddress = useSelector((state) =>
    isAccountConnectedToPermittedAccounts(
      permittedAccounts,
      internalAccount
    )
  );

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
    />
  );
};
