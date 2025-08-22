import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import { useI18nContext } from '../../hooks/useI18nContext';
import { NOTIFICATIONS_ROUTE } from '../../helpers/constants/routes';
import {
  Box,
  IconName,
  Text,
  ButtonIcon,
  ButtonIconSize,
} from '../../components/component-library';
import {
  BlockSize,
  BorderColor,
  Display,
  JustifyContent,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
} from '../../helpers/constants/design-system';
import { NotificationsPage } from '../../components/multichain';
import { Content, Header } from '../../components/multichain/pages/page';
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
  const history = useHistory();
  const location = useLocation();
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

  // Previous page
  const previousPage = location.state?.fromPage;

  return (
    <NotificationsPage>
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() =>
              previousPage
                ? history.push(previousPage)
                : history.push(NOTIFICATIONS_ROUTE)
            }
          />
        }
        endAccessory={null}
      >
        {t('notifications')}
      </Header>
      <Content padding={0}>
        {/* Allow notifications */}
        <NotificationsSettingsAllowNotifications
          loading={loadingAllowNotifications}
          setLoading={setLoadingAllowNotifications}
          dataTestId="notifications-settings-allow"
          disabled={updatingAccounts}
        />
        <Box
          borderColor={BorderColor.borderMuted}
          width={BlockSize.Full}
          style={{ height: '1px', borderBottomWidth: 0 }}
        ></Box>

        {isMetamaskNotificationsEnabled && (
          <>
            {/* Notifications settings per types */}
            <NotificationsSettingsTypes
              disabled={loadingAllowNotifications || updatingAccounts}
            />

            {/* Notifications settings per account */}
            <>
              <Box
                paddingLeft={8}
                paddingRight={8}
                paddingBottom={4}
                paddingTop={4}
                data-testid="notifications-settings-per-account"
              >
                <Text
                  variant={TextVariant.bodyMd}
                  color={TextColor.textDefault}
                >
                  {t('accountActivity')}
                </Text>
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.textAlternative}
                >
                  {t('accountActivityText')}
                </Text>
              </Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.flexStart}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.flexStart}
                gap={6}
                paddingLeft={8}
                paddingRight={8}
                paddingBottom={4}
              >
                {accounts.map((account) => (
                  <NotificationsSettingsPerAccount
                    key={account.id}
                    address={account.address}
                    name={account.metadata.name} // TODO Notifications: Migrate to new account group name
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
            </>
          </>
        )}
      </Content>
    </NotificationsPage>
  );
}
