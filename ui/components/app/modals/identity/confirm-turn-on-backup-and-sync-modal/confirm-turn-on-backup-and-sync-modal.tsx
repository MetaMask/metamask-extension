import React from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useModalProps } from '../../../../../hooks/useModalProps';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { toggleExternalServices } from '../../../../../store/actions';
import { onboardingToggleBasicFunctionalityOn } from '../../../../../ducks/app/app';

export const CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME =
  'CONFIRM_TURN_ON_BACKUP_AND_SYNC';
export const confirmTurnOnBackupAndSyncModalTestIds = {
  modal: 'confirm-turn-on-backup-and-sync-modal',
  toggleButton: 'confirm-turn-on-backup-and-sync-toggle-button',
  cancelButton: 'confirm-turn-on-backup-and-sync-cancel-button',
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function ConfirmTurnOnBackupAndSyncModal() {
  const { props, hideModal } = useModalProps();
  const { enableBackupAndSync } = props;
  const t = useI18nContext();
  const dispatch = useDispatch();

  const handleHideModal = () => {
    hideModal();
  };

  const enableBasicFunctionality = async () => {
    await Promise.all([
      dispatch(onboardingToggleBasicFunctionalityOn()),
      dispatch(toggleExternalServices(true)),
    ]);
  };

  const handleEnableBackupAndSync = async () => {
    await enableBasicFunctionality();
    await enableBackupAndSync();
    hideModal();
  };

  return (
    <Modal
      isOpen
      onClose={handleHideModal}
      data-testid={confirmTurnOnBackupAndSyncModalTestIds.modal}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          paddingBottom={4}
          paddingRight={4}
          paddingLeft={4}
          onClose={handleHideModal}
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
          >
            <Text variant={TextVariant.HeadingSm}>
              {t('backupAndSyncEnable')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          marginLeft={4}
          marginRight={4}
          marginBottom={4}
          flexDirection={BoxFlexDirection.Column}
          gap={4}
        >
          <Text variant={TextVariant.BodySm}>
            {t('backupAndSyncEnableConfirmation', [
              <Text
                asChild
                key="basic-functionality"
                variant={TextVariant.BodySm}
                fontWeight={FontWeight.Bold}
              >
                <span>{t('backupAndSyncBasicFunctionalityNameMention')}</span>
              </Text>,
            ])}
          </Text>
        </Box>
        <ModalFooter>
          <Box flexDirection={BoxFlexDirection.Row} gap={4}>
            <Button
              size={ButtonSize.Lg}
              className="w-1/2"
              variant={ButtonVariant.Secondary}
              data-testid={confirmTurnOnBackupAndSyncModalTestIds.cancelButton}
              onClick={handleHideModal}
            >
              {t('cancel')}
            </Button>
            <Button
              size={ButtonSize.Lg}
              className="w-1/2"
              variant={ButtonVariant.Primary}
              data-testid={confirmTurnOnBackupAndSyncModalTestIds.toggleButton}
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={handleEnableBackupAndSync}
            >
              {t('turnOn')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
