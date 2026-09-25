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
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type WalletRemoveModalProps = {
  type: 'locked' | 'remove';
  onClose: () => void;
  onConfirm?: () => void;
};

/**
 * Explains why the primary wallet is locked or confirms removal of another
 * entropy wallet.
 *
 * @param props - Component props.
 * @param props.type - Modal content and actions to render.
 * @param props.onClose - Called when the modal is dismissed.
 * @param props.onConfirm - Called when wallet removal is confirmed.
 */
export const WalletRemoveModal = ({
  type,
  onClose,
  onConfirm,
}: WalletRemoveModalProps) => {
  const t = useI18nContext();
  const isLocked = type === 'locked';
  const title = t(
    isLocked ? 'walletRemoveLockedTitle' : 'walletRemoveConfirmTitle',
  );
  const description = t(
    isLocked
      ? 'walletRemoveLockedDescription'
      : 'walletRemoveConfirmDescription',
  );

  return (
    <Modal isOpen onClose={onClose} data-testid={`wallet-remove-modal-${type}`}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        />
        <ModalBody>
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            gap={2}
            marginBottom={4}
            className="min-w-0 w-full"
          >
            <Icon
              name={IconName.Warning}
              size={IconSize.Xl}
              color={IconColor.ErrorDefault}
              data-testid="wallet-remove-modal-warning-icon"
            />
            <Text
              asChild
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Bold}
              color={TextColor.TextDefault}
              textAlign={TextAlign.Center}
              data-testid="wallet-remove-modal-title"
            >
              <h2>{title}</h2>
            </Text>
          </Box>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Regular}
            color={TextColor.TextAlternative}
            data-testid="wallet-remove-modal-description"
          >
            {description}
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className="w-full"
          >
            {isLocked ? (
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                onClick={onClose}
                className="w-full"
                data-testid="wallet-remove-modal-got-it-button"
              >
                {t('gotIt')}
              </Button>
            ) : (
              <>
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  isDanger
                  onClick={onConfirm}
                  className="w-full"
                  data-testid="wallet-remove-modal-remove-button"
                >
                  {t('remove')}
                </Button>
                <Button
                  variant={ButtonVariant.Secondary}
                  size={ButtonSize.Lg}
                  onClick={onClose}
                  className="w-full"
                  data-testid="wallet-remove-modal-cancel-button"
                >
                  {t('cancel')}
                </Button>
              </>
            )}
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
