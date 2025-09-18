import React, { useState, useRef } from 'react';
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
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export type MultichainAccountIntroModalProps = {
  onViewAccounts: () => void;
  onLearnMore: () => void;
  onClose: () => void;
};

export const MultichainAccountIntroModal: React.FC<
  MultichainAccountIntroModalProps
> = ({ onViewAccounts, onLearnMore, onClose }) => {
  const t = useI18nContext();
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);

  const handleViewAccounts = async () => {
    setIsLoading(true);

    try {
      await onViewAccounts();
    } catch (error) {
      console.error('Failed to process view accounts:', error);
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
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

      {/* Action buttons */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.Full}
        gap={3}
        marginTop={4}
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={handleViewAccounts}
          loading={isLoading}
          disabled={isLoading}
        >
          {t('multichainAccountIntroViewAccounts')}
        </Button>

        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onLearnMore}
          disabled={isLoading}
        >
          {t('multichainAccountIntroLearnMore')}
        </Button>
      </Box>
    </Box>
  );
};
