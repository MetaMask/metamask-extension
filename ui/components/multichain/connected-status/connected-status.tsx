import React from 'react';
import { useSelector } from 'react-redux';
import {
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { isAccountConnectedToCurrentTab } from '../../../selectors';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BadgeStatus } from '../badge-status';

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

  const currentTabIsConnectedToSelectedAddress = useSelector((state) =>
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (isAccountConnectedToCurrentTab as any)(state, address),
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
