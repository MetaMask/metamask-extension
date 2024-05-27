import React, { useEffect, useState, useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import { MetaMetricsContext } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  useSwitchAccountNotifications,
  useSwitchAccountNotificationsChange,
  type UseSwitchAccountNotificationsData,
} from '../../hooks/metamask-notifications/useSwitchNotifications';
import {
  NotificationsSettingsBox,
  NotificationsSettingsAccount,
} from '../../components/multichain';
import { getIsUpdatingMetamaskNotificationsAccount } from '../../selectors/metamask-notifications/metamask-notifications';

type NotificationsSettingsPerAccountProps = {
  address: string;
  name: string;
  disabled: boolean;
  loading: boolean;
};

export const NotificationsSettingsPerAccount = ({
  address,
  name,
  disabled,
  loading,
}: NotificationsSettingsPerAccountProps) => {
  const { listNotifications } = useMetamaskNotificationsContext();
  const trackEvent = useContext(MetaMetricsContext);

  // Hooks
  const {
    onChange: onChangeAccountNotifications,
    error: errorAccountNotificationsChange,
  } = useSwitchAccountNotificationsChange();
  const { switchAccountNotifications, error: errorSwitchAccountNotifications } =
    useSwitchAccountNotifications();

  const [data, setData] = useState<
    UseSwitchAccountNotificationsData | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Selectors
  const isUpdatingMetamaskNotificationsAccount = useSelector(
    getIsUpdatingMetamaskNotificationsAccount,
  );

  useEffect(() => {
    const fetchData = async () => {
      const fetchedData = await switchAccountNotifications([address]);
      setData(fetchedData || {});
    };
    fetchData();
  }, [address, switchAccountNotifications]);

  useEffect(() => {
    setIsLoading(loading);
  }, [loading]);

  useEffect(() => {
    const updateData = async () => {
      if (isUpdatingMetamaskNotificationsAccount.includes(address)) {
        const fetchedData = await switchAccountNotifications([address]);
        setData(fetchedData || {});
      }
    };
    updateData();
  }, [isUpdatingMetamaskNotificationsAccount]);

  const error =
    errorAccountNotificationsChange || errorSwitchAccountNotifications;

  const handleToggleAccountNotifications = useCallback(async () => {
    const originalValue = data?.[address];
    await onChangeAccountNotifications([address], !originalValue);
    trackEvent({
      category: MetaMetricsEventCategory.NotificationSettings,
      event: originalValue
        ? MetaMetricsEventName.DisablingAccountNotifications
        : MetaMetricsEventName.EnablingAccountNotifications,
      properties: {
        address,
      },
    });
    listNotifications();
  }, [address, data, onChangeAccountNotifications]);

  return (
    <>
      <NotificationsSettingsBox
        value={data?.[address] ?? false}
        onToggle={handleToggleAccountNotifications}
        key={address}
        disabled={disabled}
        loading={isLoading || !data}
        error={error}
      >
        <NotificationsSettingsAccount address={address} name={name} />
      </NotificationsSettingsBox>
    </>
  );
};
