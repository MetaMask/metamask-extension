import React, { useCallback, useEffect, useState } from 'react';
import {
  clearOnboardingReferralAccepted,
  wasOnboardingReferralAccepted,
} from '../../../../helpers/referral-rebate';
import { ReferralActivatedModal } from './referral-activated-modal';
import { ReferralInviteModal } from './referral-invite-modal';

/**
 * Sample code for the design prototype. Replace with the invited code when
 * this flow is wired up.
 */
const PROTOTYPE_REFERRAL_CODE = '8F3A21';

type ReferralRebateStep = 'invite' | 'activated' | 'closed';

/**
 * Design prototype of the referral rebate invite. Opens on Home until the
 * trigger is wired up. Accept shows the confirmation; every other action
 * closes the prototype.
 */
export const ReferralRebateFlow = () => {
  const [acceptedDuringOnboarding] = useState(wasOnboardingReferralAccepted);
  const [step, setStep] = useState<ReferralRebateStep>(
    acceptedDuringOnboarding ? 'activated' : 'invite',
  );
  const close = useCallback(() => setStep('closed'), []);

  useEffect(() => {
    if (acceptedDuringOnboarding) {
      clearOnboardingReferralAccepted();
    }
  }, [acceptedDuringOnboarding]);

  if (step === 'closed') {
    return null;
  }

  return (
    <>
      <ReferralInviteModal
        isOpen={step === 'invite'}
        referralCode={PROTOTYPE_REFERRAL_CODE}
        onAccept={() => setStep('activated')}
        onClose={close}
        onContinueWithoutReferral={close}
      />
      <ReferralActivatedModal
        isOpen={step === 'activated'}
        onClose={close}
        onStartTrading={close}
      />
    </>
  );
};
