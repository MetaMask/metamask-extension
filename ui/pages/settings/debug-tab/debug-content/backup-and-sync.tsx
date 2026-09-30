import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../components/component-library';
import {
  IconColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../../helpers/constants/design-system';
import { useDeleteAccountSyncingDataFromUserStorage } from '../../../../hooks/identity/useAccountSyncing';
import {
  devApiEnv,
  loadAuthenticationConfig,
} from '../../../../../shared/lib/authentication';
import { performSignOut } from '../../../../store/actions';
import { useDispatch } from '../../../../store/hooks';

type DeleteSyncedDataProps = {
  onDelete: () => Promise<void>;
  deleteSuccessful: boolean;
  title: string;
  description: string;
  buttonLabel?: string;
  testId?: string;
};

const DeleteSyncedData = ({
  onDelete,
  deleteSuccessful,
  title,
  description,
  buttonLabel = 'Reset',
  testId,
}: DeleteSyncedDataProps) => {
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
          <span>{title}</span>
          <div className="settings-page__content-description">
            {description}
          </div>
        </div>

        <div className="settings-page__content-item-col">
          <Button
            variant={ButtonVariant.Primary}
            onClick={onDelete}
            data-testid={testId}
          >
            {buttonLabel}
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
              hidden={!deleteSuccessful}
            />
          </Box>
        </div>
      </Box>
    </div>
  );
};

export const useDeleteAccountSyncDataProps = () => {
  const [deleteSuccessful, setDeleteSuccessful] = useState(false);
  const { dispatchDeleteAccountSyncingData } =
    useDeleteAccountSyncingDataFromUserStorage();
  const onDelete = useCallback(async () => {
    await dispatchDeleteAccountSyncingData();
    setDeleteSuccessful(true);
  }, [dispatchDeleteAccountSyncingData, setDeleteSuccessful]);
  return {
    deleteSuccessful,
    onDelete,
    title: 'Account syncing',
    description:
      'Deletes all user storage entries for the current SRP. This can help if you tested Account Syncing early on and have corrupted data. This will not remove internal accounts already created and renamed. If you want to start from scratch with only the first account and restart syncing from this point on, you will need to reinstall the extension after this action.',
  };
};

export const useClearAuthSessionProps = () => {
  const dispatch = useDispatch();
  const [deleteSuccessful, setDeleteSuccessful] = useState(false);
  const identityEnv = loadAuthenticationConfig();
  const apiEnv = devApiEnv();

  const onDelete = useCallback(async () => {
    await dispatch(performSignOut());
    setDeleteSuccessful(true);
  }, [dispatch]);

  return {
    deleteSuccessful,
    onDelete,
    title: 'Identity auth session',
    description: `Current identity env is ${identityEnv} (MM_DEV_API_ENV=${apiEnv}). Clear the persisted Profile Sync session after flipping MM_DEV_API_ENV, then unlock so a matching token can be minted.`,
    buttonLabel: 'Clear auth session',
    testId: 'identity-dev-clear-auth-session-button',
  };
};

export const BackupAndSyncDevSettings = () => {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Backup and sync
      </Text>
      <DeleteSyncedData {...useDeleteAccountSyncDataProps()} />
      <DeleteSyncedData {...useClearAuthSessionProps()} />
    </>
  );
};
