import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
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

export type MultichainAccountIntroModalProps = {
  isOpen: boolean;
  onViewAccounts: () => void;
  onLearnMore: () => void;
  onClose: () => void;
  isLoading?: boolean;
};

export const MultichainAccountIntroModal: React.FC<
  MultichainAccountIntroModalProps
> = ({ isOpen, onViewAccounts, onLearnMore, onClose, isLoading = false }) => {
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
          {/* Hero graphics - placeholder for now */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            marginBottom={4}
            gap={3}
            style={{ minHeight: '120px' }}
          >
            {/* Top row of circles */}
            <Box display={Display.Flex} gap={3}>
              <Box
                style={{ width: '60px', height: '60px' }}
                backgroundColor={BackgroundColor.errorMuted}
                borderRadius={BorderRadius.full}
              />
              <Box
                style={{ width: '60px', height: '60px' }}
                backgroundColor={BackgroundColor.warningMuted}
                borderRadius={BorderRadius.full}
              />
            </Box>

            {/* Bottom row of circles */}
            <Box display={Display.Flex} gap={3}>
              <Box
                style={{ width: '60px', height: '60px' }}
                backgroundColor={BackgroundColor.successMuted}
                borderRadius={BorderRadius.full}
              />
              <Box
                style={{ width: '60px', height: '60px' }}
                backgroundColor={BackgroundColor.infoMuted}
                borderRadius={BorderRadius.full}
              />
            </Box>
          </Box>

          {/* Main content */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.flexStart}
            width={BlockSize.Full}
            gap={3}
          >
            {/* What are multichain accounts? */}
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

            {/* Same address, more networks */}
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
};
