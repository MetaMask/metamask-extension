import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type MarketingConsentSheetProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  testId: string;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function MarketingConsentSheet({
  isOpen,
  isSubmitting,
  title,
  description,
  confirmLabel,
  testId,
  error,
  onClose,
  onConfirm,
}: Readonly<MarketingConsentSheetProps>) {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      data-testid={testId}
    >
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Sm}
        className="flex items-end justify-center p-0"
        modalDialogProps={{
          padding: 0,
          style: {
            width: '100%',
            maxWidth: '100%',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}
      >
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{
            ariaLabel: t('close'),
            'data-testid': `${testId}-close`,
          }}
        >
          <Text variant={TextVariant.HeadingSm}>{title}</Text>
        </ModalHeader>
        <ModalBody className="px-4 pb-4">
          <Box flexDirection={BoxFlexDirection.Column} gap={4}>
            <Text color={TextColor.TextAlternative}>{description}</Text>
            {error ? <Text color={TextColor.ErrorDefault}>{error}</Text> : null}
            <Box flexDirection={BoxFlexDirection.Column} gap={2}>
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={onClose}
                isDisabled={isSubmitting}
                data-testid={`${testId}-cancel`}
              >
                {t('cancel')}
              </Button>
              <Button
                variant={ButtonVariant.Primary}
                size={ButtonSize.Lg}
                isFullWidth
                onClick={() => onConfirm().catch(() => undefined)}
                isDisabled={isSubmitting}
                data-testid={`${testId}-confirm`}
              >
                {confirmLabel}
              </Button>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
