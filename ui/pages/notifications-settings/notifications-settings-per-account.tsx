import React, { useCallback } from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
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
  const { trackEvent, createEventBuilder } = useAnalytics();

  const handleToggleAccountNotifications = useCallback(async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NotificationsSettingsUpdated)
        .addCategory(MetaMetricsEventCategory.NotificationSettings)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          settings_type: 'account_notifications',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          old_value: isEnabled,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_value: !isEnabled,
        })
        .build(),
    );
    await onToggle(!isEnabled);
  }, [createEventBuilder, isEnabled, onToggle, trackEvent]);

  const checksumAddress = toChecksumHexAddress(address);
  const shortenedAddress = shortenAddress(checksumAddress);

  return (
    <>
      <NotificationsSettingsBox
        value={isEnabled ?? false}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
