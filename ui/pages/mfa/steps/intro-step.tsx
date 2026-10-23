import React from 'react';
import {
  AvatarIcon,
  AvatarIconSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { MfaMethod } from '../../../hooks/identity/mfa/engine/types';
import { maskEmail } from '../../../hooks/identity/mfa/mask-email';
import { getMethodLabelKey } from '../labels';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { type StepProps } from './step-layout';

/* eslint-disable @typescript-eslint/naming-convention -- the server's codes */
const METHOD_ICONS: Record<MfaMethod, IconName> = {
  email_otp: IconName.Mail,
  passkey: IconName.Key,
  totp: IconName.QrCode,
};
/* eslint-enable @typescript-eslint/naming-convention */

const IntroStep = ({ step, state, reason, onAction }: StepProps<'intro'>) => {
  const t = useI18nContext();

  /**
   * What a method's row says: how it works, or what is set up already.
   *
   * @param method - The method.
   * @param isDone - Whether it is set up already.
   * @returns The row's description.
   */
  const getDescription = (
    method: MfaMethod,
    isDone: boolean,
  ): string | undefined => {
    if (method === 'passkey') {
      return t(isDone ? 'mfaIntroPasskeyDone' : 'mfaIntroPasskeyDescription');
    }
    if (method === 'totp') {
      return t(isDone ? 'mfaIntroTotpDone' : 'mfaIntroTotpDescription');
    }
    if (isDone) {
      return step.email ? maskEmail(step.email) : undefined;
    }
    return t('mfaIntroEmailDescription');
  };

  return (
    <StepLayout
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
      <Box flexDirection={BoxFlexDirection.Column} className="-mx-4">
        {step.methods.map((method) => {
          const isDone = !step.missing.includes(method);
          const description = getDescription(method, isDone);
          return (
            <Box
              key={method}
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={3}
              paddingHorizontal={4}
              paddingVertical={3}
              className="min-h-14"
              data-testid={`${MfaFlowTestIds.INTRO_METHOD}-${method}${
                isDone ? '-done' : ''
              }`}
            >
              <AvatarIcon
                iconName={METHOD_ICONS[method]}
                severity={AvatarIconSeverity.Neutral}
              />
              <Box flexDirection={BoxFlexDirection.Column} className="flex-1">
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t(getMethodLabelKey(method))}
                </Text>
                {description ? (
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.TextAlternative}
                  >
                    {description}
                  </Text>
                ) : null}
              </Box>
              {isDone ? (
                <Icon name={IconName.Check} color={IconColor.SuccessDefault} />
              ) : null}
            </Box>
          );
        })}
      </Box>
    </StepLayout>
  );
};

export default IntroStep;
