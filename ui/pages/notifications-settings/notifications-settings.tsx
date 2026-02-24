import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Text,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  NOTIFICATIONS_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import {
  selectIsMetamaskNotificationsEnabled,
  getIsUpdatingMetamaskNotifications,
  getValidNotificationAccounts,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getInternalAccounts } from '../../selectors';
import { useAccountSettingsProps } from '../../hooks/metamask-notifications/useSwitchNotifications';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';
import { NotificationsSettingsTypes } from './notifications-settings-types';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';

function useNotificationAccounts() {
  const accountAddresses = useSelector(getValidNotificationAccounts);
  const internalAccounts = useSelector(getInternalAccounts);
  const accounts = useMemo(() => {
    return (
      accountAddresses
        .map((addr) => {
          const account = internalAccounts.find(
            (a) => a.address.toLowerCase() === addr.toLowerCase(),
          );
          return account;
        })
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        .filter(<T,>(val: T | undefined): val is T => Boolean(val))
    );
  }, [accountAddresses, internalAccounts]);

  return accounts;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function NotificationsSettings() {
  const navigate = useNavigate();
  const t = useI18nContext();

  // Selectors
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const accounts = useNotificationAccounts();

  // States
  const [loadingAllowNotifications, setLoadingAllowNotifications] =
    useState<boolean>(isUpdatingMetamaskNotifications);

  const accountAddresses = useMemo(
    () => accounts.map((a) => a.address),
    [accounts],
  );

  // Account Settings
  const accountSettingsProps = useAccountSettingsProps(accountAddresses);
  const updatingAccounts = accountSettingsProps.accountsBeingUpdated.length > 0;
  const refetchAccountSettings = async () => {
    await accountSettingsProps.update(accountAddresses);
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(PREVIOUS_ROUTE);
    } else {
      navigate(NOTIFICATIONS_ROUTE);
    }
  };

  return (
    <Page>
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleClose}
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
          />
        }
      >
        {t('notifications')}
      </Header>
      <Content padding={0}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Stretch}
          gap={6}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={4}
          paddingBottom={6}
        >
          {/* Allow notifications - when off, only this block is shown */}
          <NotificationsSettingsAllowNotifications
            loading={loadingAllowNotifications}
            setLoading={setLoadingAllowNotifications}
            dataTestId="notifications-settings-allow"
            disabled={updatingAccounts}
          />

          {isMetamaskNotificationsEnabled && (
            <>
              <Box className="w-full h-px border-t border-muted" />
              {/* Customize your notification */}
              <NotificationsSettingsTypes
                disabled={loadingAllowNotifications || updatingAccounts}
              />
              {/* Account activity - single section so gap-6 only between major sections */}
              <Box className="w-full h-px border-t border-muted" />
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Stretch}
                gap={6}
                data-testid="notifications-settings-per-account"
              >
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  alignItems={BoxAlignItems.Start}
                  gap={2}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.TextDefault}
                  >
                    {t('accountActivity')}
                  </Text>
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Regular}
                    color={TextColor.TextAlternative}
                  >
                    {t('accountActivityText')}
                  </Text>
                </Box>
                <Box
                  flexDirection={BoxFlexDirection.Column}
                  justifyContent={BoxJustifyContent.Start}
                  alignItems={BoxAlignItems.Stretch}
                  gap={4}
                >
                  {accounts.map((account) => (
                    <NotificationsSettingsPerAccount
                      key={account.id}
                      address={account.address}
                      name={account.metadata.name}
                      disabledSwitch={
                        accountSettingsProps.initialLoading || updatingAccounts
                      }
                      isLoading={accountSettingsProps.accountsBeingUpdated.includes(
                        account.address,
                      )}
                      isEnabled={
                        accountSettingsProps.data?.[
                          account.address.toLowerCase()
                        ] ?? false
                      }
                      refetchAccountSettings={refetchAccountSettings}
                    />
                  ))}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Content>
    </Page>
  );
}
