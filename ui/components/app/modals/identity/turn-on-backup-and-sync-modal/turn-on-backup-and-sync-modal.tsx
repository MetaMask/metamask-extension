import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { useModalProps } from '../../../../../hooks/useModalProps';
import {
  selectIsBackupAndSyncEnabled,
  selectIsBackupAndSyncUpdateLoading,
} from '../../../../../selectors/identity/backup-and-sync';
import { BACKUPANDSYNC_ROUTE } from '../../../../../helpers/constants/routes';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  ModalFooter,
} from '../../../../component-library';
import {
  AlignItems,
  BlockSize,
  BorderRadius,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
  const history = useHistory();
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
            history.push(BACKUPANDSYNC_ROUTE);
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
    history.push(BACKUPANDSYNC_ROUTE);
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
          <Box
            as="img"
            src="./images/turn-on-backup-and-sync.png"
            width={BlockSize.Full}
            borderRadius={BorderRadius.MD}
            marginBottom={4}
          />
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            marginBottom={4}
            as="div"
          >
            {t('backupAndSyncEnableDescription', [
              <Text
                as="a"
                variant={TextVariant.bodySm}
                href="https://support.metamask.io/privacy-and-security/profile-privacy"
                target="_blank"
                rel="noopener noreferrer"
                key="privacy-link"
                color={TextColor.infoDefault}
              >
                {t('backupAndSyncPrivacyLink')}
              </Text>,
            ])}
          </Text>
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            marginBottom={4}
            as="div"
          >
            {t('backupAndSyncEnableDescriptionUpdatePreferences', [
              <Text
                as="span"
                key="backup-and-sync-enable-preferences"
                variant={TextVariant.bodySmBold}
              >
                {t('backupAndSyncEnableDescriptionUpdatePreferencesPath')}
              </Text>,
            ])}
          </Text>
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
          <Box paddingLeft={4} paddingRight={4}>
            <Text as="p" color={TextColor.errorDefault} paddingTop={4}>
              {t('notificationsSettingsBoxError')}
            </Text>
          </Box>
        )}
      </ModalContent>
    </Modal>
  );
}
