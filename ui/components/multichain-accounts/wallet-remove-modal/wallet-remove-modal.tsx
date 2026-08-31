import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type WalletRemoveModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onBackupNow?: () => void;
  walletName?: string;
  isBackedUp?: boolean;
};

export const WalletRemoveModal = ({
  isOpen,
  onClose,
  onSubmit,
  onBackupNow,
  walletName,
  isBackedUp = true,
}: WalletRemoveModalProps) => {
  const t = useI18nContext();

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <ModalOverlay />
      <ModalContent className="max-w-[360px] p-6 rounded-lg">
        <ModalHeader onClose={onClose} />
        <ModalBody className="p-0">
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={2}
            className="text-center"
          >
            <Box className="w-11 h-11 rounded-full bg-error-muted flex items-center justify-center mb-2">
              <Icon
                name={IconName.Danger}
                size={IconSize.Lg}
                color={IconColor.ErrorDefault}
              />
            </Box>
            <Text
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Bold}
              color={TextColor.TextDefault}
            >
              {t('removeThisWallet')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              className="mt-1 mb-4"
            >
              {t('removeWalletDescription')}
            </Text>
          </Box>

          {!isBackedUp && (
            <BannerAlert
              severity={BannerAlertSeverity.Danger}
              marginBottom={4}
              data-testid="wallet-remove-modal-banner"
            >
              <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
                {t('walletNotBackedUpBannerTitle')}{' '}
                {onBackupNow && (
                  <button
                    type="button"
                    onClick={onBackupNow}
                    className="underline text-error-default font-medium cursor-pointer"
                  >
                    {t('backUpNow')}
                  </button>
                )}
              </Text>
            </BannerAlert>
          )}

          <Box flexDirection={BoxFlexDirection.Column} gap={3} className="mt-4">
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              danger
              onClick={onSubmit}
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
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
