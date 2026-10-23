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
import type { MfaMethod } from '../../../hooks/identity/mfa/engine/types';
import { MfaFlowTestIds } from '../test-ids';
import StepLayout, { MfaShield, type StepProps } from './step-layout';

/* eslint-disable @typescript-eslint/naming-convention -- the server's codes */
const PICKER_LABEL_KEYS: Record<MfaMethod, string> = {
  email_otp: 'mfaPickerEmailOtp',
  passkey: 'mfaPickerPasskey',
  totp: 'mfaPickerTotp',
};
/* eslint-enable @typescript-eslint/naming-convention */

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
      top={<MfaShield />}
      title={t('mfaPickerTitle')}
      description={
        step.purpose === 'verify' ? reason.verifyDescription : undefined
      }
      error={state.error}
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
    />
  );
};

export default PickerStep;
