import React, { useCallback } from 'react';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { useSwitchAccountNotificationsChange } from '../../hooks/metamask-notifications/useSwitchNotifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsAccount,
} from '../../components/multichain';
import {
  useListNotifications,
  useSafeState,
} from '../../hooks/metamask-notifications/useNotifications';
import { shortenAddress } from '../../helpers/utils/util';

type NotificationsSettingsPerAccountProps = {
  address: string;
  name: string;

  isEnabled: boolean;
  isLoading?: boolean;
  disabledSwitch?: boolean;
  refetchAccountSettings: () => Promise<void>;
  refetchNotificationPreferences?: () => Promise<unknown>;
  onToggle?: (newState: boolean) => void;
};

function useUpdateAccountSetting(
  address: string,
  refetchAccountSettings: () => Promise<void>,
  refetchNotificationPreferences?: () => Promise<unknown>,
) {
  const { onChange: switchAccountNotifications, error } =
    useSwitchAccountNotificationsChange();
  const { listNotifications: refetch } = useListNotifications();

  // Local states
  const [loading, setLoading] = useSafeState(false);

  const toggleAccount = useCallback(
    async (state: boolean) => {
      setLoading(true);
      try {
        await switchAccountNotifications([address], state);
        await refetchAccountSettings();
        await refetchNotificationPreferences?.();
        refetch();
      } catch {
        // Do nothing (we don't need to propagate this)
      }
      setLoading(false);
    },
    [
      address,
      refetch,
      refetchAccountSettings,
      refetchNotificationPreferences,
      setLoading,
      switchAccountNotifications,
    ],
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
  refetchNotificationPreferences,
  onToggle,
}: NotificationsSettingsPerAccountProps) => {
  const {
    toggleAccount,
    loading: isUpdatingAccount,
    error: accountError,
  } = useUpdateAccountSetting(
    address,
    refetchAccountSettings,
    refetchNotificationPreferences,
  );

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const loading = isLoading || isUpdatingAccount;
  const error = accountError;

  const handleToggleAccountNotifications = useCallback(async () => {
    const newState = !isEnabled;
    await toggleAccount(newState);
    onToggle?.(newState);
  }, [isEnabled, onToggle, toggleAccount]);

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
