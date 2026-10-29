import React, { useCallback } from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  NotificationsSettingsBox,
  NotificationsSettingsAccount,
} from '../../components/multichain';
import { shortenAddress } from '../../helpers/utils/util';

type NotificationsSettingsPerAccountProps = {
  address: string;
  name: string;

  isEnabled: boolean;
  isLoading?: boolean;
  disabledSwitch?: boolean;
  onToggle: (nextValue: boolean) => Promise<void>;
};

export const NotificationsSettingsPerAccount = ({
  address,
  name,
  isEnabled,
  isLoading,
  disabledSwitch,
  onToggle,
}: NotificationsSettingsPerAccountProps) => {
  const handleToggleAccountNotifications = useCallback(async () => {
    await onToggle(!isEnabled);
  }, [isEnabled, onToggle]);

  const checksumAddress = toChecksumHexAddress(address);
  const shortenedAddress = shortenAddress(checksumAddress);

  return (
    <>
      <NotificationsSettingsBox
        value={isEnabled ?? false}
        onToggle={handleToggleAccountNotifications}
        key={address}
        disabled={disabledSwitch}
        loading={isLoading}
        dataTestId={`${shortenedAddress}-notifications-settings`}
      >
        <NotificationsSettingsAccount address={address} name={name} />
      </NotificationsSettingsBox>
    </>
  );
};
