import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getMethodLabelKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { MfaShield, type StepProps } from './step-layout';

const IntroStep = ({ step, state, reason, onAction }: StepProps<'intro'>) => {
  const t = useI18nContext();
  return (
    <StepLayout
      top={<MfaShield />}
      title={t('mfaIntroTitle')}
      description={reason.enrollDescription ?? t('mfaIntroDescription')}
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
          {t('mfaIntroContinue')}
        </Button>
      }
    >
      <Text variant={TextVariant.BodyMd}>{t('mfaIntroListTitle')}</Text>
      {step.missing.map((method) => (
        <Box
          key={method}
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          <Icon
            name={method === 'email_otp' ? IconName.Mail : IconName.SecurityKey}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodyMd}>
            {t(getMethodLabelKey(method))}
          </Text>
        </Box>
      ))}
    </StepLayout>
  );
};

export default IntroStep;
