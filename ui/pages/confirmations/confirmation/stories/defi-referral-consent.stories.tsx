import React from 'react';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  ASTERDEX_APPROVAL_TYPE,
} from '../../../../../shared/constants/app';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../../../shared/constants/defi-referrals';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

const HYPERLIQUID_CONFIG = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid];
const ASTERDEX_CONFIG = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.AsterDex];

const STATE_MOCK_DEFAULT = {
  metamask: {
    preferences: {
      referrals: {
        [DefiReferralPartner.Hyperliquid]: {},
        [DefiReferralPartner.AsterDex]: {},
      },
    },
  },
};

/**
 * An approval to add a DeFi referral code to the selected account.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to the partner's approval type.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/DefiReferralConsent',
  component: ConfirmationPage,
  argTypes: {
    selectedAddress: {
      control: 'text',
      description: 'The address of the currently selected account.',
    },
  },
  args: {
    selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
  },
};

export const HyperliquidStory = (args: { selectedAddress: string }) => {
  return (
    <PendingApproval
      type={HYPERLIQUID_APPROVAL_TYPE}
      requestData={{
        selectedAddress: args.selectedAddress,
        partnerId: HYPERLIQUID_CONFIG.id,
        partnerName: HYPERLIQUID_CONFIG.name,
        learnMoreUrl: HYPERLIQUID_CONFIG.learnMoreUrl,
      }}
      state={STATE_MOCK_DEFAULT}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

HyperliquidStory.storyName = 'Hyperliquid';

export const AsterDexStory = (args: { selectedAddress: string }) => {
  return (
    <PendingApproval
      type={ASTERDEX_APPROVAL_TYPE}
      requestData={{
        selectedAddress: args.selectedAddress,
        partnerId: ASTERDEX_CONFIG.id,
        partnerName: ASTERDEX_CONFIG.name,
        learnMoreUrl: ASTERDEX_CONFIG.learnMoreUrl,
      }}
      state={STATE_MOCK_DEFAULT}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

AsterDexStory.storyName = 'AsterDex';
