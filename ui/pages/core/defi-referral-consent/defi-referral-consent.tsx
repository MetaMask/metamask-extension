import React from 'react';
import { DefiReferralPartner } from '../../../../shared/constants/defi-referrals';
import { useABTest } from '../../../hooks/useABTest';
import {
  DEFI_REFERRAL_UI_AB_TEST_EXPOSURE_METADATA,
  DEFI_REFERRAL_UI_AB_TEST_KEY,
  DEFI_REFERRAL_CONSENT_AB_TEST_VARIANTS,
} from '../../../../shared/lib/ab-testing/configs/defi-referral-ui';
import { DefiReferralConsentControl } from './defi-referral-consent-control';
import { DefiReferralConsentTreatment } from './defi-referral-consent-treatment';
import { DefiReferralConsentProps } from './defi-referral-consent.types';

const HyperliquidReferralConsentABTest: React.FC<DefiReferralConsentProps> = (
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

export const DefiReferralConsent: React.FC<DefiReferralConsentProps> = (
  props,
) => {
  // The A/B test only runs for Hyperliquid. All other partners always render
  // the control UI and are never bucketed into the experiment.
  if (props.partnerId === DefiReferralPartner.Hyperliquid) {
    return <HyperliquidReferralConsentABTest {...props} />;
  }

  return <DefiReferralConsentControl {...props} />;
};
