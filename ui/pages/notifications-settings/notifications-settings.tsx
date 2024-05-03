import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import type { InternalAccount } from '@metamask/keyring-api';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMetamaskNotificationsContext } from '../../contexts/metamask-notifications/metamask-notifications';
import {
  useSwitchAccountNotifications,
  useSwitchAccountNotificationsChange,
  type UseSwitchAccountNotificationsData,
  useSwitchFeatureAnnouncementsChange,
  useSwitchSnapNotificationsChange,
} from '../../hooks/metamask-notifications/useSwitchNotifications';
import {
  NOTIFICATIONS_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
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
import Preloader from '../../components/ui/icon/preloader/preloader-icon.component';
import {
  NotificationsPage,
  NotificationsSettingsBox,
  NotificationsSettingsType,
  NotificationsSettingsAccount,
} from '../../components/multichain';
import { Content, Header } from '../../components/multichain/pages/page';
import {
  selectIsMetamaskNotificationsEnabled,
  selectIsSnapNotificationsEnabled,
  selectIsFeatureAnnouncementsEnabled,
  selectIsMetamaskNotificationsFeatureSeen,
  selectIsCreatingMetamaskNotifications,
} from '../../selectors/metamask-notifications/metamask-notifications';
import { selectIsProfileSyncingEnabled } from '../../selectors/metamask-notifications/profile-syncing';
import { getInternalAccounts } from '../../selectors';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
import { NotificationsSettingsAllowNotifications } from './notifications-settings-allow-notifications';

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

  const { listNotifications } = useMetamaskNotificationsContext();

  const accounts: AccountType[] = useSelector(getInternalAccounts);
  const checksumAddresses = accounts.map((account) =>
    toChecksumHexAddress(account.address),
  );

  const { onChange: onChangeSnapNotifications, error: errorSnapNotifications } =
    useSwitchSnapNotificationsChange();

  const {
    onChange: onChangeFeatureAnnouncements,
    error: errorFeatureAnnouncements,
  } = useSwitchFeatureAnnouncementsChange();

  const {
    switchAccountNotifications,
    isLoading: isLoadingAccountNotifications,
    error: errorAccountNotifications,
  } = useSwitchAccountNotifications(checksumAddresses);

  const {
    onChange: onChangeAccountNotifications,
    error: errorAccountNotificationsChange,
  } = useSwitchAccountNotificationsChange();

  const [data, setData] = useState<UseSwitchAccountNotificationsData>({});

  const isMetamaskNotificationsFeatureSeen = useSelector(
    selectIsMetamaskNotificationsFeatureSeen,
  );
  const isMetamaskNotificationsEnabled = useSelector(
    selectIsMetamaskNotificationsEnabled,
  );
  const isSnapNotificationsEnabled = useSelector(
    selectIsSnapNotificationsEnabled,
  );
  const isFeatureAnnouncementsEnabled = useSelector(
    selectIsFeatureAnnouncementsEnabled,
  );
  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

  const isCreatingMetamaskNotifications = useSelector(
    selectIsCreatingMetamaskNotifications,
  );

  useEffect(() => {
    if (isMetamaskNotificationsEnabled && isProfileSyncingEnabled) {
      const fetchData = async () => {
        const originalData = await switchAccountNotifications();
        setData(
          (originalData as unknown as UseSwitchAccountNotificationsData) || {},
        );
      };
      fetchData();
    }
  }, [isMetamaskNotificationsEnabled, isProfileSyncingEnabled]);

  const handleToggleAccountNotifications = async (address: string) => {
    const currentState = data[address];
    const newState = !currentState;

    try {
      await onChangeAccountNotifications([address], newState);
      setData((prevData) => ({
        ...prevData,
        [address]: newState,
      }));
    } catch (error) {
      setData((prevData) => ({
        ...prevData,
        [address]: currentState,
      }));
    }
  };

  if (!isMetamaskNotificationsFeatureSeen) {
    listNotifications();
    history.push(DEFAULT_ROUTE);
  }

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
        children={t('notifications')}
        endAccessory={null}
      />
      <Content padding={0}>
        {isCreatingMetamaskNotifications && (
          <Box
            height={BlockSize.Full}
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            flexDirection={FlexDirection.Column}
            data-testid="notifications-list-loading"
          >
            <Preloader size={36} />
          </Box>
        )}

        {!isCreatingMetamaskNotifications && (
          <>
            {/* Allow notifications */}
            <NotificationsSettingsAllowNotifications
              data-testid="notifications-settings-allow-notifications"
              disabled={isLoadingAccountNotifications}
            />
            <Box
              borderColor={BorderColor.borderMuted}
              width={BlockSize.Full}
              style={{ height: '1px', borderBottomWidth: 0 }}
            ></Box>

            {isMetamaskNotificationsEnabled && isProfileSyncingEnabled && (
              <>
                {/* Notifications settings per types */}
                <Box
                  paddingLeft={8}
                  paddingRight={8}
                  paddingBottom={4}
                  paddingTop={4}
                  data-testid="notifications-settings-per-types"
                >
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textDefault}
                  >
                    {t('customizeYourNotifications')}
                  </Text>
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {t('customizeYourNotificationsText')}
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
                  {/* Snap notifications */}
                  <NotificationsSettingsBox
                    value={isSnapNotificationsEnabled}
                    onToggle={() =>
                      onChangeSnapNotifications(!isSnapNotificationsEnabled)
                    }
                    error={errorSnapNotifications}
                    disabled={isLoadingAccountNotifications}
                  >
                    <NotificationsSettingsType
                      icon={IconName.Snaps}
                      title={t('snaps')}
                    />
                  </NotificationsSettingsBox>

                  {/* Product announcements */}
                  <NotificationsSettingsBox
                    value={isFeatureAnnouncementsEnabled}
                    onToggle={() =>
                      onChangeFeatureAnnouncements(
                        !isFeatureAnnouncementsEnabled,
                      )
                    }
                    error={errorFeatureAnnouncements}
                    disabled={isLoadingAccountNotifications}
                  >
                    <NotificationsSettingsType
                      icon={IconName.Star}
                      title={t('productAnnouncements')}
                    />
                  </NotificationsSettingsBox>
                </Box>
                <Box
                  borderColor={BorderColor.borderMuted}
                  width={BlockSize.Full}
                  style={{ height: '1px', borderBottomWidth: 0 }}
                ></Box>

                {/* Notifications settings per account */}
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
                  {(errorAccountNotificationsChange ||
                    errorAccountNotifications) && (
                    <Text
                      paddingTop={4}
                      variant={TextVariant.bodyMd}
                      color={TextColor.errorDefault}
                    >
                      {t('notificationsSettingsBoxError')}
                    </Text>
                  )}
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
                  {isLoadingAccountNotifications && (
                    <Box
                      height={BlockSize.Full}
                      width={BlockSize.Full}
                      display={Display.Flex}
                      justifyContent={JustifyContent.center}
                      alignItems={AlignItems.center}
                      flexDirection={FlexDirection.Column}
                      data-testid="notifications-list-loading"
                    >
                      <Preloader size={36} />
                    </Box>
                  )}
                  {data &&
                    !isLoadingAccountNotifications &&
                    accounts.map((account: AccountType) => (
                      <NotificationsSettingsBox
                        value={data[account.address]}
                        onToggle={() =>
                          handleToggleAccountNotifications(account.address)
                        }
                        key={account.address}
                      >
                        <NotificationsSettingsAccount
                          address={account.address}
                          name={account.metadata.name}
                        />
                      </NotificationsSettingsBox>
                    ))}
                </Box>
              </>
            )}
          </>
        )}
      </Content>
    </NotificationsPage>
  );
}
