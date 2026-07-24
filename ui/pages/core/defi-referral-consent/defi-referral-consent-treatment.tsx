import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  Checkbox,
  FontWeight,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useBoolean } from '../../../hooks/useBoolean';
import { DefiReferralConsentProps } from './defi-referral-consent.types';

const PartnerImage: React.FC<{ partnerId: string; partnerName: string }> = ({
  partnerId,
  partnerName,
}) => {
  return (
    <img
      className="h-[190px]"
      src={`./images/${partnerId}-referral.png`}
      alt={`${partnerName} referral`}
    />
  );
};

export const DefiReferralConsentTreatment: React.FC<
  DefiReferralConsentProps
> = ({
  onActionComplete,
  selectedAddress,
  partnerId,
  partnerName,
  learnMoreUrl,
}) => {
  const t = useI18nContext();
  const { value: isChecked, toggle } = useBoolean(true);

  const handleSubmit = () => {
    onActionComplete({
      approved: isChecked,
      selectedAddress,
    });
  };

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="h-full">
      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={8}
        className="flex-1 justify-center"
      >
        <Box className="mx-auto">
          <PartnerImage partnerId={partnerId} partnerName={partnerName} />
        </Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
            {t('hyperliquidReferralTitle')}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('hyperliquidReferralSubtitle2')}
          </Text>
        </Box>
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={4} className="pt-4">
        <Box
          backgroundColor={BoxBackgroundColor.BackgroundSection}
          padding={3}
          className="rounded-lg"
        >
          <Checkbox
            id="defi-referral-consent-checkbox"
            isSelected={isChecked}
            onChange={toggle}
            label={t('hyperliquidReferralCheckboxLabel', [
              <TextButton
                key="defi-referral-partner-terms"
                asChild
                size={TextButtonSize.BodySm}
              >
                <a
                  href={learnMoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('defiReferralTerms')}
                </a>
              </TextButton>,
            ])}
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
