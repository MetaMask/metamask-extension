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
import {
  useDeleteAccountSyncingDataFromUserStorage,
  useDeleteNetworkSyncingDataFromUserStorage,
} from '../../../hooks/metamask-notifications/useProfileSyncing';

type DeleteSettingProps = {
  onDelete: () => Promise<void>;
  deleteSuccessful: boolean;
  title: string;
  description: string;
};

const DeleteSetting = (props: DeleteSettingProps) => {
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
          <span>{props.title}</span>
          <div className="settings-page__content-description">
            {props.description}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button variant={ButtonVariant.Primary} onClick={props.onDelete}>
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
              hidden={!props.deleteSuccessful}
            />
          </Box>
        </div>
      </Box>
    </div>
  );
};

const useDeleteAccountSyncProps = () => {
  const [deleteSuccessful, setDeleteSuccessful] = useState(false);
  const { dispatchDeleteAccountData } =
    useDeleteAccountSyncingDataFromUserStorage();
  const onDelete = useCallback(async () => {
    await dispatchDeleteAccountData();
    setDeleteSuccessful(true);
  }, []);
  return {
    deleteSuccessful,
    onDelete,
    title: 'Account syncing',
    description: `Deletes all user storage entries for the current SRP. This can help
            if you tested Account Syncing early on and have corrupted data. This
            will not remove internal accounts already created and renamed. If
            you want to start from scratch with only the first account and
            restart syncing from this point on, you will need to reinstall the
            extension after this action.`,
  };
};

const useDeleteNetworkSyncProps = () => {
  const [deleteSuccessful, setDeleteSuccessful] = useState(false);
  const { dispatchDeleteNetworkData } =
    useDeleteNetworkSyncingDataFromUserStorage();
  const onDelete = useCallback(async () => {
    await dispatchDeleteNetworkData();
    setDeleteSuccessful(true);
  }, []);
  return {
    deleteSuccessful,
    onDelete,
    title: 'Network syncing',
    description: `Deletes all user storage entries for the current SRP. This can help
            if you tested Network Syncing early on and have corrupted data. This
            will not remove any networks you currently have on your device. If
            you want to start from scratch, you will need to reinstall the
            extension after this action.`,
  };
};

export const ProfileSyncDevSettings = () => {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Profile Sync
      </Text>
      <DeleteSetting {...useDeleteAccountSyncProps()} />
      <DeleteSetting {...useDeleteNetworkSyncProps()} />
    </>
  );
};
