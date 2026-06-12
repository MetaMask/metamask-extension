import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import {
  Box,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useModalProps } from '../../../../../hooks/useModalProps';
import {
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../../selectors/identity/backup-and-sync';
import { BACKUPANDSYNC_ROUTE } from '../../../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  AlignItems,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '../../../../component-library';
import { useBackupAndSync } from '../../../../../hooks/identity/useBackupAndSync';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getUseExternalServices } from '../../../../../selectors';
import { showModal } from '../../../../../store/actions';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../confirm-turn-on-backup-and-sync-modal';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';

export const TURN_ON_BACKUP_AND_SYNC_MODAL_NAME = 'TURN_ON_BACKUP_AND_SYNC';
export const turnOnBackupAndSyncModalTestIds = {
  modal: 'turn-on-backup-and-sync-modal',
  button: 'turn-on-backup-and-sync-button',
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function TurnOnBackupAndSyncModal() {
  const { hideModal } = useModalProps();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent } = useContext(MetaMetricsContext);

  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);
  const isBackupAndSyncUpdateLoading = useSelector(
    selectIsBackupAndSyncUpdateLoading,
  );

  const { setIsBackupAndSyncFeatureEnabled, error } = useBackupAndSync();

  const handleDismissModal = () => {
    trackEvent({
      event: MetaMetricsEventName.ProfileActivityUpdated,
      category: MetaMetricsEventCategory.BackupAndSync,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_name: 'Backup And Sync Carousel Modal',
        action: 'Modal Dismissed',
      },
    });
    hideModal();
  };

  const handleTurnOnBackupAndSync = async () => {
    trackEvent({
      event: MetaMetricsEventName.ProfileActivityUpdated,
      category: MetaMetricsEventCategory.BackupAndSync,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_name: 'Backup And Sync Carousel Modal',
        action: 'Turned On',
      },
    });

    if (!isBasicFunctionalityEnabled) {
      dispatch(
        showModal({
          name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
          enableBackupAndSync: async () => {
            navigate(BACKUPANDSYNC_ROUTE);
            await setIsBackupAndSyncFeatureEnabled(
              BACKUPANDSYNC_FEATURES.main,
              true,
            );
          },
        }),
      );
      return;
    }
    if (!isBackupAndSyncEnabled) {
      await setIsBackupAndSyncFeatureEnabled(BACKUPANDSYNC_FEATURES.main, true);
    }
    navigate(BACKUPANDSYNC_ROUTE);
    hideModal();
  };

  return (
    <Modal
      isOpen
      onClose={handleDismissModal}
      data-testid={turnOnBackupAndSyncModalTestIds.modal}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={handleDismissModal}>
          {t('backupAndSyncEnable')}
        </ModalHeader>
        <ModalBody>
          <img
            src="./images/turn-on-backup-and-sync.png"
            className="w-full rounded-md mb-4"
            alt=""
          />
          <Box marginBottom={4}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              asChild
            >
              <div>
                {t('backupAndSyncEnableDescription', [
                  <Text
                    asChild
                    variant={TextVariant.BodySm}
                    key="privacy-link"
                    color={TextColor.InfoDefault}
                  >
                    <a
                      href={ZENDESK_URLS.PROFILE_PRIVACY}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('backupAndSyncPrivacyLink')}
                    </a>
                  </Text>,
                ])}
              </div>
            </Text>
          </Box>
          <Box marginBottom={4}>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              asChild
            >
              <div>
                {t('backupAndSyncEnableDescriptionUpdatePreferences', [
                  <Text
                    asChild
                    key="backup-and-sync-enable-preferences"
                    variant={TextVariant.BodySm}
                    fontWeight={FontWeight.Bold}
                  >
                    <span>
                      {t('backupAndSyncEnableDescriptionUpdatePreferencesPath')}
                    </span>
                  </Text>,
                ])}
              </div>
            </Text>
          </Box>
        </ModalBody>
        <ModalFooter
          paddingTop={4}
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={() => handleTurnOnBackupAndSync()}
          containerProps={{
            flexDirection: FlexDirection.Column,
            alignItems: AlignItems.stretch,
          }}
          submitButtonProps={{
            children: t('backupAndSyncEnable'),
            loading: isBackupAndSyncUpdateLoading,
            disabled: isBackupAndSyncUpdateLoading,
            'data-testid': turnOnBackupAndSyncModalTestIds.button,
          }}
        />
        {error && (
          <Box paddingLeft={4} paddingRight={4} paddingTop={4}>
            <Text color={TextColor.ErrorDefault}>
              {t('notificationsSettingsBoxError')}
            </Text>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}
