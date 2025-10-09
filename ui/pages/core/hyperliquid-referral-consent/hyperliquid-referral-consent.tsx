import React, { useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
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
      alt="Hyperliquid referral"
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
    <Box flexDirection={BoxFlexDirection.Column} className="h-full">
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={4}
        className="mb-6"
      >
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
        alignItems={BoxAlignItems.Center}
        className="h-full"
      >
        <Box paddingBottom={6} paddingHorizontal={4}>
          <HyperliquidImage />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          <Box
            backgroundColor={BoxBackgroundColor.BackgroundSection}
            padding={3}
            className="rounded-lg"
          >
            <Checkbox
              id="hyperliquid-referral-consent-checkbox"
              isSelected={isChecked}
              onChange={handleCheckboxClick}
              label={t('hyperliquidReferralCheckboxLabel')}
              labelProps={{
                variant: TextVariant.BodySm,
                color: TextColor.TextAlternative,
              }}
              className="items-start cursor-pointer"
            />
          </Box>
          <Button onClick={handleSubmit}>{t('confirm')}</Button>
        </Box>
      </Box>
    </Box>
  );
};
