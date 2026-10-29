import React, { useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';
import { getErrorHandling } from '../../../hooks/identity/mfa/engine/errors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getFailureCopyKeys } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

/**
 * The screen a flow ends on when it fails. An error only support can fix
 * offers to contact support, whose link carries the error code so it can skip
 * the support bot.
 *
 * @param props - The step's props.
 * @param props.step - The failure step.
 * @param props.state - The flow's state.
 * @param props.onAction - Retries or closes the flow.
 */
const FailureStep = ({ step, state, onAction }: StepProps<'failure'>) => {
  const t = useI18nContext();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { title, description } = getFailureCopyKeys(step.code);
  const supportLink = new URL(SUPPORT_LINK as string);
  supportLink.searchParams.set('mfa_error', step.code);
  const dismiss = () => onAction({ type: 'dismiss' });

  const renderFooter = () => {
    if (getErrorHandling(step.code) === 'support') {
      return (
        <>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={() => setIsSupportOpen(true)}
            data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
          >
            {t('mfaFailureContactSupport')}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            isFullWidth
            onClick={dismiss}
            data-testid={MfaFlowTestIds.SECONDARY_BUTTON}
          >
            {t('mfaFailureDone')}
          </Button>
        </>
      );
    }
    // The header's back button leaves, so a retry is the only action.
    return step.canRetry ? (
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        isFullWidth
        isLoading={state.busy}
        onClick={() => onAction({ type: 'retry' })}
        data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
      >
        {t('mfaFailureRetry')}
      </Button>
    ) : (
      <Button
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        isFullWidth
        onClick={dismiss}
        data-testid={MfaFlowTestIds.SECONDARY_BUTTON}
      >
        {t('mfaFailureClose')}
      </Button>
    );
  };

  return (
    <>
      <StepLayout
        isVerticallyCentered
        top={
          <img
            src="./images/mfa-failure.svg"
            alt=""
            width={370}
            height={64}
            className="self-center max-w-full h-auto"
          />
        }
        title={t(title)}
        description={description ? t(description) : undefined}
        footer={renderFooter()}
      />
      {isSupportOpen ? (
        <VisitSupportDataConsentModal
          isOpen
          onClose={() => setIsSupportOpen(false)}
          supportLink={supportLink.toString()}
        />
      ) : null}
    </>
  );
};

export default FailureStep;
