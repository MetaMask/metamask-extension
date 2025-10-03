import React from 'react';
import { HYPERLIQUID_APPROVAL_TYPE } from '../../../../../shared/constants/app';
import ConfirmationPage from '../confirmation';
import { PendingApproval } from './util';

const STATE_MOCK_DEFAULT = {
  metamask: {
    preferences: {
      referrals: {
        hyperliquid: {},
      },
    },
  },
};

/**
 * An approval to add a Hyperliquid referral code to the selected account.<br/><br/>
 * Automatically displayed via the `ConfirmationPage` component when using the `ApprovalController.add` method with the `type` set to `hyperliquid_referral_consent`.<br/><br/>
 * The below arguments are properties of the `requestData` object required by the `ApprovalController.add` method.
 */
export default {
  title: 'Pages/ConfirmationPage/HyperliquidReferralConsent',
  component: ConfirmationPage,
  argTypes: {
    approved: {
      control: 'boolean',
      description: 'Whether or not the referral is approved.',
    },
    selectedAddress: {
      control: 'text',
      description: 'The address of the currently selected account.',
    },
  },
  args: {
    approved: true,
    selectedAddress: '0x123',
  },
};

export const DefaultStory = (args) => {
  return (
    <PendingApproval
      type={HYPERLIQUID_APPROVAL_TYPE}
      requestData={args}
      state={STATE_MOCK_DEFAULT}
    >
      <ConfirmationPage />
    </PendingApproval>
  );
};

DefaultStory.storyName = 'Default';
