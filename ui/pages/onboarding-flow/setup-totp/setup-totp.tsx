import React, { useMemo, useState } from 'react';
import {
  Box,
  Text,
  Button,
  ButtonVariant,
  ButtonSize,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  TextVariant,
  TextColor,
  FontWeight,
  BoxFlexDirection,
  BoxJustifyContent,
  IconColor,
} from '@metamask/design-system-react';
import {
  buildTotpOtpAuthUri,
  generateTotpSecret,
  verifyTotpCode,
} from '@metamask/secret-escrow-client';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../../components/component-library';

export type SetupTotpProps = {
  accountName: string;
  onBack: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onComplete: (secret: string) => Promise<void>;
};

/**
 * Onboarding TOTP enrollment: show shared secret, confirm with a live code.
 *
 * @param props - Component props.
 * @param props.accountName - Label for otpauth URI (e.g. social email).
 * @param props.onBack - Back to manage factors.
 * @param props.onComplete - Called with verified base32 secret to enroll.
 */
export default function SetupTotp({
  accountName,
  onBack,
  onComplete,
}: SetupTotpProps) {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const [secret] = useState(() => generateTotpSecret());
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otpAuthUri = useMemo(
    () =>
      buildTotpOtpAuthUri({
        secret,
        accountName: accountName || 'MetaMask',
      }),
    [accountName, secret],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const valid = await verifyTotpCode(secret, code);
      if (!valid) {
        setError(t('secretEscrowTotpInvalidCode'));
        return;
      }
      await onComplete(secret);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : t('secretEscrowTotpInvalidCode'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      gap={4}
      className="h-full w-full"
      data-testid="setup-totp"
      padding={4}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={4} className="w-full">
        <Box className="w-full">
          <Box className="mb-4 w-full">
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              color={IconColor.IconDefault}
              size={ButtonIconSize.Md}
              data-testid="setup-totp-back-button"
              type="button"
              onClick={onBack}
              ariaLabel={t('back')}
            />
          </Box>
          <Text variant={TextVariant.HeadingLg} className="mb-2">
            {t('secretEscrowTotpSetupTitle')}
          </Text>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('secretEscrowTotpSetupDescription')}
          </Text>
        </Box>

        <Box flexDirection={BoxFlexDirection.Column} gap={2} className="w-full">
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
          >
            {t('secretEscrowTotpSecretLabel')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            className="break-all font-mono"
            data-testid="setup-totp-secret"
          >
            {secret}
          </Text>
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
            className="break-all"
            data-testid="setup-totp-otpauth-uri"
          >
            {otpAuthUri}
          </Text>
        </Box>

        <form onSubmit={handleSubmit} className="w-full">
          <FormTextField
            id="setup-totp-code"
            label={t('secretEscrowTotpCodeLabel')}
            size={FormTextFieldSize.Lg}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/[^\d]/gu, '').slice(0, 6))
            }
            inputProps={{
              'data-testid': 'setup-totp-code-input',
              autoComplete: 'one-time-code',
              inputMode: 'numeric',
              placeholder: t('secretEscrowTotpCodePlaceholder'),
            }}
            error={Boolean(error)}
            helpText={error ?? undefined}
          />
          <Button
            type="submit"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full mt-4"
            data-testid="setup-totp-submit"
            disabled={code.length !== 6 || isSubmitting}
          >
            {t('continue')}
          </Button>
        </form>
      </Box>
    </Box>
  );
}
