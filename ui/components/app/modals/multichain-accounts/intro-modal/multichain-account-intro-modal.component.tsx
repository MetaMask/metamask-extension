import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { LottieAnimation } from '../../../../component-library/lottie-animation';

export type MultichainAccountIntroModalProps = {
  isOpen: boolean;
  onViewAccounts: () => void;
  onLearnMore: () => void;
  onClose: () => void;
  isLoading?: boolean;
};

const MemoizedLottieAnimation = React.memo(LottieAnimation);

export const MultichainAccountIntroModal: React.FC<MultichainAccountIntroModalProps> =
  React.memo(
    ({ isOpen, onViewAccounts, onLearnMore, onClose, isLoading = false }) => {
      const t = useI18nContext();

      return (
        <Modal
          isOpen={isOpen}
          onClose={onClose}
          isClosedOnOutsideClick
          isClosedOnEscapeKey
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader onClose={onClose}>
              {t('multichainAccountsIntroductionModalTitle')}
            </ModalHeader>
            <ModalBody>
              <Box
                className="flex"
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Center}
                marginBottom={4}
              >
                <MemoizedLottieAnimation
                  path="images/animations/multichain-accounts/MM_MultichainAccounts_Polycon-and-network_Lottie.json"
                  loop
                  autoplay
                  className="multichain-accounts-intro-modal__lottie-animation"
                />
              </Box>
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.Start}
                className="flex w-full"
                gap={3}
              >
                <Box>
                  <Text variant={TextVariant.headingMd} marginBottom={2}>
                    {t('multichainAccountIntroWhatTitle')}
                  </Text>
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textAlternative}
                  >
                    {t('multichainAccountIntroWhatDescription')}
                  </Text>
                </Box>
                <Box>
                  <Text variant={TextVariant.headingMd} marginBottom={2}>
                    {t('multichainAccountIntroSameAddressTitle')}
                  </Text>
                  <Text
                    variant={TextVariant.bodyMd}
                    color={TextColor.textAlternative}
                  >
                    {t('multichainAccountIntroSameAddressDescription')}
                  </Text>
                </Box>
              </Box>
            </ModalBody>

            <ModalFooter>
              <Box
                className="flex"
                flexDirection={BoxFlexDirection.Column}
                gap={4}
              >
                <Button
                  variant={ButtonVariant.Primary}
                  size={ButtonSize.Lg}
                  block
                  onClick={onViewAccounts}
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading
                    ? t('multichainAccountIntroSettingUp')
                    : t('multichainAccountIntroViewAccounts')}
                </Button>
                <Button
                  variant={ButtonVariant.Link}
                  size={ButtonSize.Lg}
                  block
                  onClick={onLearnMore}
                  disabled={isLoading}
                >
                  {t('multichainAccountIntroLearnMore')}
                </Button>
              </Box>
            </ModalFooter>
          </ModalContent>
        </Modal>
      );
    },
  );
