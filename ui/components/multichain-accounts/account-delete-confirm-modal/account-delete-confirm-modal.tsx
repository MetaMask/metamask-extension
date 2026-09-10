import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextAlign,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type AccountDeleteConfirmModalProps = {
  isOpen: boolean;
  accountName: string;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Confirmation modal shown before removing an imported private-key account
 * from the multichain account list edit mode.
 *
 * @param props - Component props.
 * @param props.isOpen - Whether the modal is visible.
 * @param props.accountName - Display name interpolated into the modal title.
 * @param props.onClose - Called when the modal is dismissed (cancel / overlay).
 * @param props.onConfirm - Called when the user confirms removal.
 */
export const AccountDeleteConfirmModal = ({
  isOpen,
  accountName,
  onClose,
  onConfirm,
}: AccountDeleteConfirmModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid="account-delete-confirm-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
            className="min-w-0 w-full"
          >
            <Icon
              name={IconName.Warning}
              size={IconSize.Xl}
              color={IconColor.ErrorDefault}
              data-testid="account-delete-confirm-modal-warning-icon"
            />
            <Text
              asChild
              variant={TextVariant.HeadingSm}
              textAlign={TextAlign.Center}
            >
              <h2>{t('removeAccountConfirmTitle', [accountName])}</h2>
            </Text>
          </Box>
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd}>
            {t('removeAccountConfirmDescription')}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className="w-full"
          >
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              isDanger
              onClick={onConfirm}
              className="w-full"
              data-testid="account-delete-confirm-modal-remove-button"
            >
              {t('remove')}
            </Button>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Lg}
              onClick={onClose}
              className="w-full"
              data-testid="account-delete-confirm-modal-cancel-button"
            >
              {t('cancel')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
