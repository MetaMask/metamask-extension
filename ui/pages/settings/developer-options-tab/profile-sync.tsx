import React, { useCallback, useState } from 'react';

import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';

import {
  IconColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../helpers/constants/design-system';
import { useDeleteAccountSyncingDataFromUserStorage } from '../../../hooks/metamask-notifications/useProfileSyncing';

const AccountSyncDeleteDataFromUserStorage = () => {
  const [hasDeletedAccountSyncEntries, setHasDeletedAccountSyncEntries] =
    useState(false);

  const { dispatchDeleteAccountSyncingDataFromUserStorage } =
    useDeleteAccountSyncingDataFromUserStorage();

  const handleDeleteAccountSyncingDataFromUserStorage =
    useCallback(async () => {
      await dispatchDeleteAccountSyncingDataFromUserStorage();
      setHasDeletedAccountSyncEntries(true);
    }, [
      dispatchDeleteAccountSyncingDataFromUserStorage,
      setHasDeletedAccountSyncEntries,
    ]);

  return (
    <div className="settings-page__content-padded">
      <Box
        className="settings-page__content-row"
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <div className="settings-page__content-item">
          <span>Account syncing</span>
          <div className="settings-page__content-description">
            Deletes all user storage entries for the current SRP. This can help
            if you tested Account Syncing early on and have corrupted data. This
            will not remove internal accounts already created and renamed. If
            you want to start from scratch with only the first account and
            restart syncing from this point on, you will need to reinstall the
            extension after this action.
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            onClick={handleDeleteAccountSyncingDataFromUserStorage}
          >
            Reset
          </Button>
        </div>
        <div className="settings-page__content-item-col">
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            paddingLeft={2}
            paddingRight={2}
            style={{ height: '40px', width: '40px' }}
          >
            <Icon
              className="settings-page-developer-options__icon-check"
              name={IconName.Check}
              color={IconColor.successDefault}
              size={IconSize.Lg}
              hidden={!hasDeletedAccountSyncEntries}
            />
          </Box>
        </div>
      </Box>
    </div>
  );
};

export const ProfileSyncDevSettings = () => {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Profile Sync
      </Text>
      <AccountSyncDeleteDataFromUserStorage />
    </>
  );
};
