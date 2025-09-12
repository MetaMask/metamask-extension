import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  AlignItems,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { hideModal } from '../../../../store/actions';

export interface MultichainAccountIntroModalProps {
  onViewAccounts: () => void;
  onLearnMore: () => void;
  onClose: () => void;
}

export const MultichainAccountIntroModal: React.FC<
  MultichainAccountIntroModalProps
> = ({ onViewAccounts, onLearnMore, onClose }) => {
  const t = useI18nContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    onClose();
  };

  const handleViewAccounts = async () => {
    setIsLoading(true);

    // Minimum 2-second loading state as per requirements
    const minLoadingTime = 2000;
    const startTime = Date.now();

    try {
      await onViewAccounts();
    } catch (error) {
      console.error('Failed to process view accounts:', error);
    } finally {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      if (remainingTime > 0) {
        setTimeout(() => {
          setIsLoading(false);
        }, remainingTime);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleLearnMore = () => {
    onLearnMore();
  };

  return (
    <Box
      className="multichain-account-intro-modal"
      padding={4}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.Center}
      style={{ maxWidth: '400px', minHeight: '500px' }}
    >
      {/* Close button */}
      <Box
        display={Display.Flex}
        width={BlockSize.Full}
        justifyContent={JustifyContent.FlexEnd}
        marginBottom={3}
      >
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Sm}
          onClick={handleClose}
          ariaLabel={t('close')}
        >
          <Icon name={IconName.Close} size={IconSize.Sm} />
        </Button>
      </Box>

      {/* Hero graphics - placeholder for now until marketing provides animation */}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.Center}
        justifyContent={JustifyContent.Center}
        marginBottom={4}
        gap={2}
        style={{ minHeight: '120px' }}
      >
        {/* Top row of circles */}
        <Box display={Display.Flex} gap={2}>
          <Box
            width="60px"
            height="60px"
            backgroundColor="#E91E63" // Pink
            borderRadius={BorderRadius.Full}
          />
          <Box
            width="60px"
            height="60px"
            backgroundColor="#FFC107" // Yellow
            borderRadius={BorderRadius.Full}
          />
        </Box>

        {/* Bottom row of circles */}
        <Box display={Display.Flex} gap={2} marginTop={2}>
          <Box
            width="60px"
            height="60px"
            backgroundColor="#00695C" // Teal
            borderRadius={BorderRadius.Full}
          />
          <Box
            width="60px"
            height="60px"
            backgroundColor="#FF5722" // Orange
            borderRadius={BorderRadius.Full}
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
          disabled={isLoading}
        >
          {isLoading ? (
            <Box display={Display.Flex} alignItems={AlignItems.Center} gap={2}>
              <Icon name={IconName.Loading} size={IconSize.Sm} />
              <Text>{t('multichainAccountIntroSettingUp')}</Text>
            </Box>
          ) : (
            t('multichainAccountIntroViewAccounts')
          )}
        </Button>

        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={handleLearnMore}
          disabled={isLoading}
        >
          {t('multichainAccountIntroLearnMore')}
        </Button>
      </Box>
    </Box>
  );
};
