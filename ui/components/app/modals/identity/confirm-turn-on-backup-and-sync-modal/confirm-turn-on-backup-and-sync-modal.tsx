import React from 'react';
import { useDispatch } from 'react-redux';
import { useModalProps } from '../../../../../hooks/useModalProps';
import {
  ButtonSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Box,
  Text,
  ModalFooter,
  Button,
  ButtonVariant,
} from '../../../../component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
      <ModalContent
        modalDialogProps={{
          display: Display.Flex,
          flexDirection: FlexDirection.Column,
        }}
      >
        <ModalHeader
          paddingBottom={4}
          paddingRight={4}
          paddingLeft={4}
          onClose={handleHideModal}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
          >
            <Text variant={TextVariant.headingSm}>
              {t('backupAndSyncEnable')}
            </Text>
          </Box>
        </ModalHeader>

        <Box
          marginLeft={4}
          marginRight={4}
          marginBottom={4}
          display={Display.Flex}
          gap={4}
          flexDirection={FlexDirection.Column}
        >
          <Text variant={TextVariant.bodySm}>
            {t('backupAndSyncEnableConfirmation', [
              <Text
                key="basic-functionality"
                variant={TextVariant.bodySmBold}
                as="span"
              >
                {t('backupAndSyncBasicFunctionalityNameMention')}
              </Text>,
            ])}
          </Text>
        </Box>
        <ModalFooter
          containerProps={{
            flexDirection: FlexDirection.Row,
            alignItems: AlignItems.stretch,
          }}
        >
          <Box display={Display.Flex} gap={4}>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
              variant={ButtonVariant.Secondary}
              data-testid={confirmTurnOnBackupAndSyncModalTestIds.cancelButton}
              onClick={handleHideModal}
            >
              {t('cancel')}
            </Button>
            <Button
              size={ButtonSize.Lg}
              width={BlockSize.Half}
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
