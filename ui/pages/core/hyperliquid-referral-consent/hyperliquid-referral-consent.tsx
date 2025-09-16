import React, { useState } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  Checkbox,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
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
      width="full"
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
    <Box flexDirection={BoxFlexDirection.Column}>
      <Box flexDirection={BoxFlexDirection.Column} gap={4} className="mb-6">
        <Text
          textAlign={TextAlign.Center}
          variant={TextVariant.HeadingMd}
          fontWeight={FontWeight.Bold}
        >
          {t('hyperliquidReferralTitle')}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('hyperliquidReferralSubtitle')}{' '}
          <HyperliquidLink text={t('learnMoreUpperCase')} />
        </Text>
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box paddingBottom={6}>
          <HyperliquidImage />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Start}
            padding={3}
            backgroundColor={BoxBackgroundColor.BackgroundSection}
            gap={3}
            className="rounded-lg"
          >
            <Checkbox
              id="hyperliquid-referral-consent"
              isSelected={isChecked}
              onChange={handleCheckboxClick}
            />
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('hyperliquidReferralCheckboxLabel')}
            </Text>
          </Box>
          <Button onClick={handleSubmit}>{t('confirm')}</Button>
        </Box>
      </Box>
    </Box>
  );
};
