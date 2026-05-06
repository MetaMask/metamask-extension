import React from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonVariant,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PartnerLink } from './partner-link';
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

  const handleSubmit = (value: boolean) => {
    onActionComplete({
      approved: value,
      selectedAddress,
    });
  };

  // If this is done inline, verify-locales will output
  // `Forbidden use of template strings in 't' function`
  const defiReferralTitle = `${partnerId}ReferralTitle`;
  const defiReferralSubtitle = `${partnerId}ReferralSubtitle2`;
  const defiReferralConfirmText = `${partnerId}ReferralConfirmText`;
  // This is here to stop yarn verify-locales from removing these strings
  t('hyperliquidReferralTitle');
  t('gmxReferralTitle');
  t('asterdexReferralTitle');
  t('hyperliquidReferralSubtitle2');
  t('gmxReferralSubtitle2');
  t('asterdexReferralSubtitle2');
  t('hyperliquidReferralConfirmText');
  t('gmxReferralConfirmText');
  t('asterdexReferralConfirmText');

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full justify-between pt-12"
    >
      <Box>
        <Box flexDirection={BoxFlexDirection.Column} gap={8} className="mb-4">
          <Box className="m-auto">
            <PartnerImage partnerId={partnerId} partnerName={partnerName} />
          </Box>
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
            {t(defiReferralTitle)}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t(defiReferralSubtitle, [
              <PartnerLink
                key="defi-referral-partner-terms"
                text={t('defiReferralTerms')}
                url={learnMoreUrl}
              />,
            ])}
          </Text>
        </Box>
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={2}>
        <Button onClick={() => handleSubmit(true)}>
          {t(defiReferralConfirmText)}
        </Button>
        <Button
          variant={ButtonVariant.Tertiary}
          onClick={() => handleSubmit(false)}
        >
          {t('defiReferralNoThanks')}
        </Button>
      </Box>
    </Box>
  );
};
