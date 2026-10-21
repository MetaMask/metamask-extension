import React, { useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { getMfaErrorCode } from '@metamask/profile-sync-controller/sdk';
import { useMfa } from '../../../hooks/identity/mfa';
import { extensionMfaControllerAdapter } from '../../../hooks/identity/mfa/bindings';
import type { MfaFlowResult } from '../../../hooks/identity/mfa/engine/types';
import { MfaSettingsTestIds } from './test-ids';

type Mfa = ReturnType<typeof useMfa>;

type Preset = {
  label: string;
  run: (mfa: Mfa) => Promise<MfaFlowResult>;
};

const reason = (operation: string) => ({
  operation: `qa.${operation}`,
  enrollDescription: `QA preset: ${operation}`,
  verifyDescription: `QA preset: ${operation}`,
});

const PRESETS: Preset[] = [
  {
    label: 'Verify with email',
    run: (mfa) =>
      mfa.verifyOrEnroll({
        methods: ['email_otp'],
        verifyWith: 'email_otp',
        reason: reason('verifyEmail'),
      }),
  },
  {
    label: 'Verify with email, max 30s old',
    run: (mfa) =>
      mfa.verifyOrEnroll({
        methods: ['email_otp'],
        verifyWith: 'email_otp',
        maxSessionAgeMs: 30_000,
        reason: reason('verifyEmailFresh'),
      }),
  },
  {
    label: 'Require email, no verification',
    run: (mfa) =>
      mfa.verifyOrEnroll({
        methods: ['email_otp'],
        reason: reason('requireEmail'),
      }),
  },
  {
    label: 'Enroll email',
    run: (mfa) =>
      mfa.enroll({ method: 'email_otp', reason: reason('enrollEmail') }),
  },
  {
    label: 'Email and passkey (no passkey adapter)',
    run: (mfa) =>
      mfa.verifyOrEnroll({
        methods: ['passkey', 'email_otp'],
        verifyWith: ['passkey', 'email_otp'],
        reason: reason('emailAndPasskey'),
      }),
  },
];

const describeResult = ({ credentials, token }: MfaFlowResult) =>
  [
    `Resolved. ${credentials.length} credential(s)`,
    token
      ? `token amr=${token.claims.amr.join(',')}, obtained ${new Date(
          token.obtainedAt,
        ).toLocaleTimeString()}`
      : 'no token',
  ].join('\n');

/**
 * Non-production buttons that run each kind of flow and show how it settled.
 */
const MfaQaPresets = () => {
  const mfa = useMfa();
  const [result, setResult] = useState<string>();

  const runPreset = async ({ label, run }: Preset) => {
    setResult(`${label}: running`);
    try {
      setResult(`${label}: ${describeResult(await run(mfa))}`);
    } catch (error) {
      setResult(
        `${label}: Rejected with ${getMfaErrorCode(error) ?? 'unknown'}`,
      );
    }
  };

  const clearSession = async () => {
    await extensionMfaControllerAdapter.clearVerificationSession();
    setResult('Verification session cleared');
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      gap={3}
      data-testid={MfaSettingsTestIds.QA_PRESETS}
    >
      <Text variant={TextVariant.HeadingSm}>QA presets (non-production)</Text>
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Md}
          isFullWidth
          onClick={() => runPreset(preset)}
        >
          {preset.label}
        </Button>
      ))}
      <Button
        variant={ButtonVariant.Tertiary}
        size={ButtonSize.Md}
        isFullWidth
        onClick={clearSession}
      >
        Clear verification session
      </Button>
      {result ? (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="whitespace-pre-line"
          data-testid={MfaSettingsTestIds.QA_RESULT}
        >
          {result}
        </Text>
      ) : null}
    </Box>
  );
};

export default MfaQaPresets;
