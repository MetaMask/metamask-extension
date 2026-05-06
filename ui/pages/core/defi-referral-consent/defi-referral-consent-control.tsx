import React from 'react';
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
import { useBoolean } from '../../../hooks/useBoolean';
import { PartnerLink } from './partner-link';
import { DefiReferralConsentProps } from './defi-referral-consent.types';

const PartnerImage: React.FC<{ partnerId: string; partnerName: string }> = ({
  partnerId,
  partnerName,
}) => {
  return (
    <img
      src={`./images/${partnerId}-referral.png`}
      alt={`${partnerName} referral`}
    />
  );
};

export const DefiReferralConsentControl: React.FC<DefiReferralConsentProps> = ({
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

  // If this is done inline, verify-locales will output
  // `Forbidden use of template strings in 't' function`
  const defiReferralSubtitle = `${partnerId}ReferralSubtitle`;
  // This is here to stop yarn verify-locales from removing these strings
  t('hyperliquidReferralSubtitle');
  t('gmxReferralSubtitle');
  t('asterdexReferralSubtitle');

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
          {t(defiReferralSubtitle)}{' '}
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
            onChange={toggle}
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
