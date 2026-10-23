import React from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  AvatarIconSize,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getSpecificErrorMessageKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

const FailureStep = ({ step, state, onAction }: StepProps<'failure'>) => {
  const t = useI18nContext();
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
