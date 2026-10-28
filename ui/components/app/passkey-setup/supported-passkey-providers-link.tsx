import React from 'react';
import { TextButton, TextColor } from '@metamask/design-system-react';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../hooks/useI18nContext';

const supportedProvidersLinkClassName =
  'underline underline-offset-2 hover:underline';

/**
 * Link to the support article section that lists PRF-capable passkey providers.
 */
export function SupportedPasskeyProvidersLink() {
  const t = useI18nContext();

  return (
    <TextButton
      asChild
      color={TextColor.PrimaryDefault}
      className={supportedProvidersLinkClassName}
    >
      <a
        href={ZENDESK_URLS.SUPPORTED_PASSKEYS}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="passkey-migration-supported-providers-link"
      >
        {t('passkeyMigrationSupportedProviders')}
      </a>
    </TextButton>
  );
}

/**
 * Renders a passkey setup error. The PRF-not-supported message includes the
 * supported-providers link.
 *
 * @param options0 - Component props.
 * @param options0.message - Translated ceremony error.
 * @param options0.passkeyMethodLabel - OS-specific passkey method label.
 */
export function PasskeyEnrollmentError({
  message,
  passkeyMethodLabel,
}: Readonly<{
  message: string;
  passkeyMethodLabel: string;
}>) {
  const t = useI18nContext() as (
    key: string,
    substitutions?: string[],
  ) => string;
  const isPasskeyNotSupported =
    message === t('passkeyErrorNotSupported', [passkeyMethodLabel]);

  if (!isPasskeyNotSupported) {
    return <span>{message}</span>;
  }

  return (
    <>
      <span>{message}</span> <SupportedPasskeyProvidersLink />
    </>
  );
}
