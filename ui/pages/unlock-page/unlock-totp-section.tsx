import React, { FormEvent, useState, type ReactNode } from 'react';
import {
  Box,
  Text,
  TextButton,
  BoxFlexDirection,
  BoxAlignItems,
  TextVariant,
  TextColor,
  TextAlign,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import {
  FormTextField,
  FormTextFieldSize,
} from '../../components/component-library';
import { BlockSize } from '../../helpers/constants/design-system';
import { getPasskeyAuthMethodKey } from '../../../shared/lib/passkey';
import { useI18nContext } from '../../hooks/useI18nContext';

export type UnlockTotpSectionProps = {
  logoSection: ReactNode;
  isRehydrationFlow: boolean;
  showUsePassword: boolean;
  showUsePasskey: boolean;
  onUnlockWithTotp: (code: string) => Promise<void>;
  onUsePassword: () => void;
  onUsePasskey: () => void;
};

/**
 * Unlock / rehydration form for an enrolled secret-escrow TOTP factor.
 *
 * @param props - Component props.
 * @param props.logoSection
 * @param props.isRehydrationFlow
 * @param props.showUsePassword
 * @param props.showUsePasskey
 * @param props.onUnlockWithTotp
 * @param props.onUsePassword
 * @param props.onUsePasskey
 * @returns TOTP unlock UI.
 */
export const UnlockTotpSection = ({
  logoSection,
  isRehydrationFlow,
  showUsePassword,
  showUsePasskey,
  onUnlockWithTotp,
  onUsePassword,
  onUsePasskey,
}: UnlockTotpSectionProps) => {
  const t = useI18nContext() as (key: string, ...args: unknown[]) => string;
  const passkeyMethodLabel = t(getPasskeyAuthMethodKey());
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSubmitting || code.trim().length < 6) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onUnlockWithTotp(code.trim());
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
      className="unlock-page w-full"
      alignItems={BoxAlignItems.Center}
      gap={4}
      padding={4}
    >
      <form onSubmit={handleSubmit} data-testid="unlock-totp-form" className="w-full">
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={4}
          className="w-full"
        >
          {logoSection}
          {isRehydrationFlow ? (
            <Text
              data-testid="unlock-totp-title"
              variant={TextVariant.DisplayMd}
              className="mb-4"
              color={TextColor.TextDefault}
              textAlign={TextAlign.Center}
            >
              {t('welcomeBack')}
            </Text>
          ) : null}
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            textAlign={TextAlign.Center}
            className="w-full"
          >
            {t('secretEscrowTotpUnlockDescription')}
          </Text>
          <FormTextField
            id="totp-code"
            placeholder={t('secretEscrowTotpCodePlaceholder')}
            size={FormTextFieldSize.Lg}
            inputProps={{
              'data-testid': 'unlock-totp-code',
              'aria-label': t('secretEscrowTotpCodeLabel'),
              inputMode: 'numeric',
              autoComplete: 'one-time-code',
              maxLength: 8,
            }}
            onChange={(event) => {
              setCode(event.target.value.replace(/\s/gu, ''));
              setError(null);
            }}
            value={code}
            error={Boolean(error)}
            helpText={error ?? undefined}
            autoFocus
            width={BlockSize.Full}
            marginBottom={2}
          />
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            type="submit"
            data-testid="unlock-totp-submit"
            disabled={code.trim().length < 6 || isSubmitting}
            isLoading={isSubmitting}
          >
            {t('unlock')}
          </Button>
          {showUsePasskey ? (
            <TextButton
              type="button"
              data-testid="unlock-use-passkey-from-totp-button"
              color={TextColor.PrimaryDefault}
              className="text-center"
              onClick={onUsePasskey}
            >
              {t('unlockWithPasskey', [passkeyMethodLabel])}
            </TextButton>
          ) : null}
          {showUsePassword ? (
            <TextButton
              type="button"
              data-testid="unlock-use-password-from-totp-button"
              color={TextColor.PrimaryDefault}
              className="text-center"
              onClick={onUsePassword}
            >
              {t('usePassword')}
            </TextButton>
          ) : null}
        </Box>
      </form>
    </Box>
  );
};
