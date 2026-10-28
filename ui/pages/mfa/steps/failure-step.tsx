import React, { useState } from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '@metamask/design-system-react';
import { SUPPORT_LINK } from '../../../../shared/lib/ui-utils';
import VisitSupportDataConsentModal from '../../../components/app/modals/visit-support-data-consent-modal';
import { getErrorHandling } from '../../../hooks/identity/mfa/engine/errors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSpecificErrorMessageKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

/**
 * An error only support can fix: the user contacts support, whose link carries
 * the error code so it can skip the support bot, or leaves.
 *
 * @param props - The step's props.
 * @param props.step - The failure step.
 * @param props.onAction - Closes the flow.
 */
const ContactSupportStep = ({ step, onAction }: StepProps<'failure'>) => {
  const t = useI18nContext();
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const supportLink = new URL(SUPPORT_LINK as string);
  supportLink.searchParams.set('mfa_error', step.code);

  return (
    <>
      <StepLayout
        top={
          <img
            src="./images/mfa-contact-support.svg"
            alt=""
            className="self-center"
          />
        }
        title={t('mfaFailureSupportTitle')}
        description={t('mfaFailureSupportDescription')}
        footer={
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
              onClick={() => onAction({ type: 'dismiss' })}
              data-testid={MfaFlowTestIds.SECONDARY_BUTTON}
            >
              {t('mfaFailureDone')}
            </Button>
          </>
        }
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

const FailureStep = (props: StepProps<'failure'>) => {
  const { step, state, onAction } = props;
  const t = useI18nContext();
  if (getErrorHandling(step.code) === 'support') {
    return <ContactSupportStep {...props} />;
  }
  const specificKey = getSpecificErrorMessageKey(step.code);
  return (
    <StepLayout
      top={
        <AvatarIcon
          iconName={IconName.Danger}
          severity={AvatarIconSeverity.Danger}
          size={AvatarIconSize.Xl}
          className="self-center"
        />
      }
      title={t('mfaFailureTitle')}
      // The title already says something went wrong; only a specific
      // reason adds to it.
      description={specificKey ? t(specificKey) : undefined}
      footer={
        <>
          {step.canRetry ? (
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
          ) : null}
          <Button
            variant={
              step.canRetry ? ButtonVariant.Secondary : ButtonVariant.Primary
            }
            size={ButtonSize.Lg}
            isFullWidth
            isDisabled={state.busy}
            onClick={() => onAction({ type: 'dismiss' })}
            data-testid={MfaFlowTestIds.SECONDARY_BUTTON}
          >
            {t('mfaFailureClose')}
          </Button>
        </>
      }
    />
  );
};

export default FailureStep;
