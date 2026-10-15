import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

const PasskeyStep = ({ step, state, onAction }: StepProps<'passkey'>) => {
  const t = useI18nContext();
  return (
    <StepLayout
      title={t(
        step.purpose === 'setup'
          ? 'mfaPasskeyTitleSetup'
          : 'mfaPasskeyTitleVerify',
      )}
      description={t('mfaPasskeyDescription')}
      error={state.error}
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          isLoading={state.busy}
          onClick={() => onAction({ type: 'continue' })}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaPasskeyContinue')}
        </Button>
      }
    />
  );
};

export default PasskeyStep;
