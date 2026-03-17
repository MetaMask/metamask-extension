import React, { useState, useCallback, useContext } from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useSwitchAccountNotificationsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsAccount,
} from '../../components/multichain';
import { useListNotifications } from '../../hooks/metamask-notifications/useNotifications';
import { shortenAddress } from '../../helpers/utils/util';

type NotificationsSettingsPerAccountProps = {
  address: string;
  name: string;

  isEnabled: boolean;
  isLoading?: boolean;
  disabledSwitch?: boolean;
  refetchAccountSettings: () => Promise<void>;
};

function useUpdateAccountSetting(
  address: string,
  refetchAccountSettings: () => Promise<void>,
) {
  const { onChange: switchAccountNotifications, error } =
    useSwitchAccountNotificationsChange();
  const { listNotifications: refetch } = useListNotifications();

  // Local states
  const [loading, setLoading] = useState(false);

  const toggleAccount = useCallback(
    async (state: boolean) => {
      setLoading(true);
      try {
        await switchAccountNotifications([address], state);
        await refetchAccountSettings();
        refetch();
      } catch {
        // Do nothing (we don't need to propagate this)
      }
      setLoading(false);
    },
    [address, refetch, refetchAccountSettings, switchAccountNotifications],
  );

  return { toggleAccount, loading, error };
}

export const NotificationsSettingsPerAccount = ({
  address,
  name,
  isEnabled,
  isLoading,
  disabledSwitch,
  refetchAccountSettings,
}: NotificationsSettingsPerAccountProps) => {
  const { trackEvent } = useContext(MetaMetricsContext);

  const {
    toggleAccount,
    loading: isUpdatingAccount,
    error: accountError,
  } = useUpdateAccountSetting(address, refetchAccountSettings);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const loading = isLoading || isUpdatingAccount;
  const error = accountError;

  const handleToggleAccountNotifications = useCallback(async () => {
    trackEvent({
      category: MetaMetricsEventCategory.NotificationSettings,
      event: MetaMetricsEventName.NotificationsSettingsUpdated,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        settings_type: 'account_notifications',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        old_value: isEnabled,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_value: !isEnabled,
      },
    });
    await toggleAccount(!isEnabled);
  }, [address, isEnabled, toggleAccount, trackEvent]);

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
        loading={loading}
        error={error}
        dataTestId={`${shortenedAddress}-notifications-settings`}
      >
        <NotificationsSettingsAccount address={address} name={name} />
      </NotificationsSettingsBox>
    </>
  );
};
