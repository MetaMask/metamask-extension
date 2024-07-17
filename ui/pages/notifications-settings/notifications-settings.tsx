import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import type { InternalAccount } from '@metamask/keyring-api';
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
  selectIsNotificationServicesEnabled,
  getIsUpdatingMetamaskNotifications,
  getIsUpdatingMetamaskNotificationsAccount,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { getInternalAccounts } from '../../selectors';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';
import { NotificationsSettingsTypes } from './notifications-settings-types';
import { NotificationsSettingsPerAccount } from './notifications-settings-per-account';

// Define KeyringType interface
type KeyringType = {
  type: string;
};

// Define AccountType interface
type AccountType = InternalAccount & {
  balance: string;
  keyring: KeyringType;
  label: string;
};

export default function NotificationsSettings() {
  const history = useHistory();
  const t = useI18nContext();

  // Selectors
  const isNotificationServicesEnabled = useSelector(
    selectIsNotificationServicesEnabled,
  );
  const isUpdatingMetamaskNotifications = useSelector(
    getIsUpdatingMetamaskNotifications,
  );
  const isUpdatingMetamaskNotificationsAccount = useSelector(
    getIsUpdatingMetamaskNotificationsAccount,
  );
  const accounts: AccountType[] = useSelector(getInternalAccounts);

  // States
  const [loadingAllowNotifications, setLoadingAllowNotifications] =
    useState<boolean>(isUpdatingMetamaskNotifications);
  const [updatingAccountList, setUpdatingAccountList] = useState<string[]>([]);
  const [updatingAccount, setUpdatingAccount] = useState<boolean>(false);

  useEffect(() => {
    if (updatingAccountList.length > 0) {
      setUpdatingAccount(true);
    } else {
      setUpdatingAccount(false);
    }
  }, [updatingAccountList]);

  useEffect(() => {
    if (isUpdatingMetamaskNotifications) {
      setLoadingAllowNotifications(isUpdatingMetamaskNotifications);
    }
  }, [isUpdatingMetamaskNotifications]);

  useEffect(() => {
    if (isUpdatingMetamaskNotificationsAccount) {
      setUpdatingAccountList(isUpdatingMetamaskNotificationsAccount);
    }
  }, [isUpdatingMetamaskNotificationsAccount]);

  return (
    <NotificationsPage>
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel="Back"
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            onClick={() => history.push(NOTIFICATIONS_ROUTE)}
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
          data-testid="notifications-settings-allow-notifications"
          disabled={updatingAccount}
        />
        <Box
          borderColor={BorderColor.borderMuted}
          width={BlockSize.Full}
          style={{ height: '1px', borderBottomWidth: 0 }}
        ></Box>

        {isNotificationServicesEnabled && (
          <>
            {/* Notifications settings per types */}
            <NotificationsSettingsTypes
              disabled={loadingAllowNotifications || updatingAccount}
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
                    name={account.metadata.name}
                    disabled={updatingAccountList.length > 0}
                    loading={updatingAccountList.includes(account.address)}
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
