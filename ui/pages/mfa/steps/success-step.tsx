import React, { useEffect } from 'react';
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
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

export const SUCCESS_AUTO_CLOSE_MS = 1500;

const SuccessStep = ({ onAction }: StepProps<'success'>) => {
  const t = useI18nContext();

  useEffect(() => {
    const id = setTimeout(
      () => onAction({ type: 'dismiss' }),
      SUCCESS_AUTO_CLOSE_MS,
    );
    return () => clearTimeout(id);
  }, [onAction]);

  return (
    <StepLayout
      top={
        <Icon
          name={IconName.Confirmation}
          color={IconColor.SuccessDefault}
          size={IconSize.Xl}
        />
      }
      title={t('mfaSuccessTitle')}
      footer={
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isFullWidth
          onClick={() => onAction({ type: 'dismiss' })}
          data-testid={MfaFlowTestIds.PRIMARY_BUTTON}
        >
          {t('mfaSuccessDone')}
        </Button>
      }
    />
  );
};

export default SuccessStep;
