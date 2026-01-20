import React, { useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  Checkbox,
  FontWeight,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

export type DefiReferralConsentProps = {
  onActionComplete: (result: {
    approved: boolean;
    selectedAddress: string;
  }) => void;
  selectedAddress: string;
  partnerId: string;
  partnerName: string;
  learnMoreUrl: string;
};

const PartnerLink: React.FC<{ text: string; url: string }> = ({
  text,
  url,
}) => {
  return (
    <a
      href={url}
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

const PartnerImage: React.FC<{ partnerId: string; partnerName: string }> = ({
  partnerId,
  partnerName,
}) => {
  return (
    <img
      src={`./images/${partnerId}-referral.png`}
      alt={`${partnerName} referral`}
      width="full"
    />
  );
};

export const DefiReferralConsent: React.FC<DefiReferralConsentProps> = ({
  onActionComplete,
  selectedAddress,
  partnerId,
  partnerName,
  learnMoreUrl,
}) => {
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
      flexDirection={BoxFlexDirection.Column}
      className="h-full justify-between"
    >
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
          {t('defiReferralTitle', [partnerName])}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('defiReferralSubtitle')}{' '}
          <PartnerLink
            text={`${t('learnMoreUpperCase')}.`}
            url={learnMoreUrl}
          />
        </Text>
      </Box>
      <Box paddingBottom={6} paddingHorizontal={4}>
        <PartnerImage partnerId={partnerId} partnerName={partnerName} />
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={4}>
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Checkbox
            id="defi-referral-consent-checkbox"
            isSelected={isChecked}
            onChange={handleCheckboxClick}
            label={t('defiReferralCheckboxLabel')}
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
  );
};
