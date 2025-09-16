import React, { useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { HYPERLIQUID_REFERRAL_LEARN_MORE_URL } from '../../../../shared/lib/ui-utils';

export type HyperliquidReferralConsentProps = {
  onActionComplete: (result: {
    approved: boolean;
    selectedAddress: string;
  }) => void;
  selectedAddress: string;
};

const HyperliquidLink: React.FC<{ text: string }> = ({ text }) => {
  return (
    <a
      href={HYPERLIQUID_REFERRAL_LEARN_MORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--color-primary-default)',
        cursor: 'pointer',
      }}
    >
      {text}
    </a>
  );
};

const HyperliquidImage: React.FC = () => {
  return (
    <img
      src="./images/hyperliquid-referral.png"
      alt="Hyperliquid referral image"
      width={BlockSize.Full}
    />
  );
};

export const HyperliquidReferralConsent: React.FC<
  HyperliquidReferralConsentProps
> = ({ onActionComplete, selectedAddress }) => {
  const t = useI18nContext();
  const [isChecked, setIsChecked] = useState(true);

  const handleSubmit = () => {
    onActionComplete({
      approved: isChecked,
      selectedAddress,
    });
  };

  const handleCheckboxClick = () => {
    setIsChecked(!isChecked);
  };

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      height={BlockSize.Full}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        paddingBottom={6}
      >
        <Text
          variant={TextVariant.headingMd}
          fontWeight={FontWeight.Bold}
          paddingBottom={4}
        >
          {t('hyperliquidReferralTitle')}
        </Text>
        <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
          {t('hyperliquidReferralSubtitle')}{' '}
          <HyperliquidLink text={t('learnMoreUpperCase')} />
        </Text>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
        height={BlockSize.Full}
      >
        <Box paddingBottom={4}>
          <HyperliquidImage />
        </Box>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Box
            display={Display.Flex}
            alignItems={AlignItems.flexStart}
            padding={3}
            backgroundColor={BackgroundColor.backgroundSection}
            borderRadius={BorderRadius.MD}
          >
            <Checkbox
              id="hyperliquid-referral-consent"
              isChecked={isChecked}
              onChange={handleCheckboxClick}
              marginRight={2}
            />
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              marginLeft={1}
            >
              {t('hyperliquidReferralCheckboxLabel')}
            </Text>
          </Box>
          <Button onClick={handleSubmit} marginTop={4}>
            {t('confirm')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};
