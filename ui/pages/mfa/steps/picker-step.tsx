import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMethodLabelKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { MfaShield, type StepProps } from './step-layout';

const PickerStep = ({ step, state, reason, onAction }: StepProps<'picker'>) => {
  const t = useI18nContext();
  return (
    <StepLayout
      top={<MfaShield />}
      title={t('mfaPickerTitle')}
      description={
        step.purpose === 'verify' ? reason.verifyDescription : undefined
      }
      error={state.error}
    >
      {step.options.map((method) => (
        <Button
          key={method}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          isFullWidth
          isDisabled={state.busy}
          onClick={() => onAction({ type: 'choose', method })}
          data-testid={`${MfaFlowTestIds.PICKER_OPTION}-${method}`}
        >
          {t(getMethodLabelKey(method))}
        </Button>
      ))}
    </StepLayout>
  );
};

export default PickerStep;
