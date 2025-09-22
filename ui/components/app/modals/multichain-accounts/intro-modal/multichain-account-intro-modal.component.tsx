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
        <Box
      className="multichain-account-intro-modal"
      padding={6}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      width={BlockSize.Full}
      style={{ minHeight: '500px' }}
    >
      {/* Close button */}
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        justifyContent={JustifyContent.flexEnd}
        marginBottom={3}
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

      {/* Hero graphics - placeholder for now until marketing provides animation */}
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
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('multichainAccountIntroWhatDescription')}
          </Text>
        </Box>

        {/* Same address, more networks */}
        <Box>
          <Text variant={TextVariant.headingMd} marginBottom={2}>
            {t('multichainAccountIntroSameAddressTitle')}
          </Text>
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('multichainAccountIntroSameAddressDescription')}
          </Text>
        </Box>
      </Box>

    </Box>
      </ModalContent>

      <ModalFooter
        onSubmit={onViewAccounts}
        onCancel={onLearnMore}
        submitButtonProps={{
          children: isLoading
            ? t('multichainAccountIntroSettingUp')
            : t('multichainAccountIntroViewAccounts'),
          loading: isLoading,
          disabled: isLoading,
          size: ButtonSize.Lg,
        }}
        cancelButtonProps={{
          children: t('multichainAccountIntroLearnMore'),
          variant: ButtonVariant.Link,
          disabled: isLoading,
          size: ButtonSize.Lg,
        }}
      />
    </Modal>
  );
};
