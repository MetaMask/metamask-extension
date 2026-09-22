import React from 'react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { BaseUrl } from '../../../../shared/constants/urls';

type PasskeySetupPromptProps = {
  enrollmentError: string | null;
  isPrfMigrationError: boolean;
  passkeyMethodLabel: string;
  passkeyMethodSpecificLabel: string;
  onSetup: () => void;
  onSkip: () => void;
};

/**
 * Shows the passkey setup prompt, including the PRF migration retry state.
 *
 * @param options0 - Component props.
 * @param options0.enrollmentError - Ceremony error shown below the description.
 * @param options0.isPrfMigrationError - Whether replacement failed because PRF
 * was required.
 * @param options0.passkeyMethodLabel - OS-specific passkey method label.
 * @param options0.passkeyMethodSpecificLabel - Specific passkey method label.
 * @param options0.onSetup - Starts or retries the passkey ceremony.
 * @param options0.onSkip - Skips passkey setup.
 */
export function PasskeySetupPrompt({
  enrollmentError,
  isPrfMigrationError,
  passkeyMethodLabel,
  passkeyMethodSpecificLabel,
  onSetup,
  onSkip,
}: PasskeySetupPromptProps) {
  const i18n = useI18nContext();
  const t = i18n as (key: string, substitutions?: string[]) => string;
  const tWithRichSubstitutions = i18n as (
    key: string,
    substitutions?: (string | React.ReactNode)[],
  ) => React.ReactNode;
  const primaryActionLabel = isPrfMigrationError
    ? t('passkeyMigrationReplacementTryAgain')
    : t('setUpPasskey', [passkeyMethodLabel]);

  return (
    <>
      <Text
        variant={TextVariant.HeadingLg}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextDefault}
      >
        {isPrfMigrationError
          ? t('passkeyMigrationReplacementTitle')
          : t('unlockWithPasskey', [passkeyMethodLabel])}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {isPrfMigrationError
          ? tWithRichSubstitutions('passkeyMigrationReplacementDescription', [
              <TextButton
                asChild
                key="passkey-migration-supported-providers"
                color={TextColor.PrimaryDefault}
                className="underline underline-offset-2 hover:underline"
              >
                <a
                  href={BaseUrl.MetaMask}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="passkey-migration-supported-providers-link"
                >
                  {t('passkeyMigrationSupportedProviders')}
                </a>
              </TextButton>,
            ])
          : t('passkeyDescription', [passkeyMethodSpecificLabel])}
      </Text>

      {enrollmentError ? (
        <BannerAlert
          severity={BannerAlertSeverity.Danger}
          description={enrollmentError}
          data-testid="passkey-enrollment-error"
        />
      ) : null}

      <Box
        flexDirection={BoxFlexDirection.Column}
        gap={4}
        className="mt-auto w-full"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          data-testid="passkey-set-up-button"
          aria-label={primaryActionLabel}
          onClick={onSetup}
        >
          {primaryActionLabel}
        </Button>
        <TextButton
          type="button"
          className="w-full"
          color={TextColor.PrimaryDefault}
          data-testid="passkey-maybe-later-button"
          onClick={onSkip}
        >
          {isPrfMigrationError
            ? t('passkeyMigrationReplacementKeepCurrent')
            : t('maybeLater')}
        </TextButton>
      </Box>
    </>
  );
}
