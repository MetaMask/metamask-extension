import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getErrorMessageKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

const FailureStep = ({ step, state, onAction }: StepProps<'failure'>) => {
  const t = useI18nContext();
  return (
    <StepLayout
      top={
        <Icon
          name={IconName.Danger}
          color={IconColor.ErrorDefault}
          size={IconSize.Xl}
        />
      }
      title={t('mfaFailureTitle')}
      description={t(getErrorMessageKey(step.code))}
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
