import React from 'react';
import {
  HYPERLIQUID_APPROVAL_TYPE,
  GMX_APPROVAL_TYPE,
} from '../../../../../shared/constants/app';
import {
  DEFI_REFERRAL_PARTNERS,
  DefiReferralPartner,
} from '../../../../../shared/constants/defi-referrals';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

const HYPERLIQUID_CONFIG = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.Hyperliquid];
const GMX_CONFIG = DEFI_REFERRAL_PARTNERS[DefiReferralPartner.GMX];

const STATE_MOCK_DEFAULT = {
  metamask: {
    preferences: {
      referrals: {
        [DefiReferralPartner.Hyperliquid]: {},
        [DefiReferralPartner.GMX]: {},
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

export const GMXStory = (args: { selectedAddress: string }) => {
  return (
    <PendingApproval
      type={GMX_APPROVAL_TYPE}
      requestData={{
        selectedAddress: args.selectedAddress,
        partnerId: GMX_CONFIG.id,
        partnerName: GMX_CONFIG.name,
        learnMoreUrl: GMX_CONFIG.learnMoreUrl,
      }}
      state={STATE_MOCK_DEFAULT}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

GMXStory.storyName = 'GMX';
