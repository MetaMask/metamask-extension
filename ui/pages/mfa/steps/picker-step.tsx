import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type {
  MfaFlowErrorCode,
  MfaMethod,
} from '../../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, {
  MfaShield,
  StepMessage,
  type StepProps,
} from './step-layout';

/* eslint-disable @typescript-eslint/naming-convention -- the server's codes */
const PICKER_LABEL_KEYS: Record<MfaMethod, string> = {
  email_otp: 'mfaPickerEmailOtp',
  passkey: 'mfaPickerPasskey',
  totp: 'mfaPickerTotp',
};
/* eslint-enable @typescript-eslint/naming-convention */

// The sheet was closed or the passkey was refused: the user can try again or
// choose another method from the same list.
const PASSKEY_ERRORS = new Set<MfaFlowErrorCode>([
  'passkey_ceremony_cancelled',
  'invalid_assertion',
]);

/**
 * How to verify, as on mobile's sheet: a passkey, when offered, is the main
 * button, with the biometrics icon; the other methods follow below an "or".
 *
 * @param props - The step's props.
 * @param props.step - The picker step.
 * @param props.state - The flow state.
 * @param props.reason - Why the feature asks.
 * @param props.onAction - Sends the chosen method.
 */
const PickerStep = ({ step, state, reason, onAction }: StepProps<'picker'>) => {
  const t = useI18nContext();
  const hasPasskey = step.options.includes('passkey');
  const others = step.options.filter((method) => method !== 'passkey');
  const isPasskeyError =
    state.error !== undefined && PASSKEY_ERRORS.has(state.error);
  const renderOption = (method: MfaMethod, isMain: boolean) => (
    <Button
      key={method}
      variant={isMain ? ButtonVariant.Primary : ButtonVariant.Secondary}
      size={ButtonSize.Lg}
      isFullWidth
      isDisabled={state.busy}
      startIconName={isMain ? IconName.Fingerprint : undefined}
      onClick={() => onAction({ type: 'choose', method })}
      data-testid={`${MfaFlowTestIds.PICKER_OPTION}-${method}`}
    >
      {t(PICKER_LABEL_KEYS[method])}
    </Button>
  );

  return (
    <StepLayout
      onAction={onAction}
      top={<MfaShield />}
      title={t('mfaPickerTitle')}
      description={
        step.purpose === 'verify' ? reason.verifyDescription : undefined
      }
      error={isPasskeyError ? undefined : state.error}
      footer={
        <Box flexDirection={BoxFlexDirection.Column} gap={4}>
          {hasPasskey ? renderOption('passkey', true) : null}
          {hasPasskey && others.length > 0 ? (
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              gap={4}
            >
              <Box className="flex-1 border-t border-muted" />
              <Text variant={TextVariant.BodyMd} color={TextColor.TextMuted}>
                {t('mfaPickerOr')}
              </Text>
              <Box className="flex-1 border-t border-muted" />
            </Box>
          ) : null}
          {others.map((method) => renderOption(method, false))}
        </Box>
      }
    >
      {isPasskeyError ? (
        <StepMessage isError>{t('mfaPickerPasskeyFailed')}</StepMessage>
      ) : null}
    </StepLayout>
  );
};

export default PickerStep;
