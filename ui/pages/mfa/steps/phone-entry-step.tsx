import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  MfaFlowAction,
  MfaFlowState,
} from '../../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from '../test-ids';
import PhoneNumberEntry from '../phone-number-entry/phone-number-entry';
import type { PhoneNumberValue } from '../phone-number-entry/phone';
import { StepError } from './step-layout';

/** The action this step sends with the number the user entered. */
export type SubmitPhoneAction = {
  type: 'submitPhone';
  phone: PhoneNumberValue;
};

/**
 * The props every step screen gets, for a step the engine does not plan yet:
 * the SMS method has no backend, so `phoneEntry` is not part of
 * `MfaFlowStep`. Once it is, this becomes `StepProps<'phoneEntry'>`.
 */
export type PhoneEntryStepProps = {
  step: { name: 'phoneEntry'; prefillPhone?: string };
  state: Pick<MfaFlowState, 'busy' | 'error'>;
  onAction: (action: MfaFlowAction | SubmitPhoneAction) => void;
};

/**
 * The MFA flow's phone number step: `PhoneNumberEntry` with the flow's copy,
 * its state and its actions.
 *
 * @param props - The step's props.
 * @param props.step - The step the engine is on.
 * @param props.state - The flow's state.
 * @param props.onAction - Sends the user's actions to the flow.
 */
const PhoneEntryStep = ({ step, state, onAction }: PhoneEntryStepProps) => {
  const t = useI18nContext();
  return (
    <PhoneNumberEntry
      title={t('mfaPhoneEntryTitle')}
      description={t('mfaPhoneEntryDescription')}
      ctaLabel={t('mfaPhoneEntryContinue')}
      disclaimer={t('mfaPhoneEntryDisclaimer')}
      initialValue={step.prefillPhone}
      isSubmitting={state.busy}
      error={
        state.error ? (
          <StepError code={state.error} onAction={onAction} />
        ) : undefined
      }
      onSubmit={async (phone) => onAction({ type: 'submitPhone', phone })}
      testIdPrefix={MfaFlowTestIds.PHONE_ENTRY_PREFIX}
    />
  );
};

export default PhoneEntryStep;
