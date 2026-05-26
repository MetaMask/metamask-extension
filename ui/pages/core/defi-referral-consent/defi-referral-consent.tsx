import React from 'react';
import { useABTest } from '../../../hooks/useABTest';
import {
  DEFI_REFERRAL_UI_AB_TEST_EXPOSURE_METADATA,
  DEFI_REFERRAL_UI_AB_TEST_KEY,
  DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS,
} from '../../../../shared/lib/ab-testing/configs/defi-referral-ui';
import { DefiReferralConsentControl } from './defi-referral-consent-control';
import { DefiReferralConsentTreatment } from './defi-referral-consent-treatment';
import { DefiReferralConsentProps } from './defi-referral-consent.types';

export const DefiReferralConsent: React.FC<DefiReferralConsentProps> = (
  props,
) => {
  const { variant } = useABTest(
    DEFI_REFERRAL_UI_AB_TEST_KEY,
    DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS,
    DEFI_REFERRAL_UI_AB_TEST_EXPOSURE_METADATA,
  );

  if (variant.isRedesignEnabled) {
    return <DefiReferralConsentTreatment {...props} />;
  }

  return <DefiReferralConsentControl {...props} />;
};
