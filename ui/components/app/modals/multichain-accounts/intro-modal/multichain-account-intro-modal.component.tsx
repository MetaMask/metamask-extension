import React from 'react';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
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
            {/* Close button */}
            <Box
              display={Display.Flex}
              width={BlockSize.Full}
              justifyContent={JustifyContent.flexEnd}
              marginBottom={3}
              paddingTop={6}
              paddingRight={6}
            >
              <Button
                variant={ButtonVariant.Link}
                size={ButtonSize.Sm}
                onClick={onClose}
                aria-label={t('close')}
              >
                <Icon name={IconName.Close} size={IconSize.Sm} />
              </Button>
            </Box>

            <ModalBody paddingTop={0}>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.center}
                justifyContent={JustifyContent.center}
                marginBottom={4}
                gap={3}
                style={{ minHeight: '120px' }}
              >
                <MemoizedLottieAnimation
                  path="images/animations/multichain-accounts/MM_MultichainAccounts_Polycon-and-network_Lottie.json"
                  loop
                  autoplay
                />
              </Box>
              <Box
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                alignItems={AlignItems.flexStart}
                width={BlockSize.Full}
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
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
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
