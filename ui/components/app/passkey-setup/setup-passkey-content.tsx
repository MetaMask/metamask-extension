import React, { useCallback } from 'react';
import { usePasskeyEnrollment } from '../../../hooks/passkey/usePasskeyEnrollment';
import { usePasskeyPrfMigration } from '../../../hooks/passkey/usePasskeyPrfMigration';
import { PasskeySetupView } from './passkey-setup-view';
import type {
  PasskeySetupOperation,
  SetupPasskeyContentProps,
} from './passkey-setup.types';

export type { SetupPasskeyContentProps } from './passkey-setup.types';

/**
 * Reusable passkey setup content used by onboarding, restore-vault, and PRF
 * migration flows.
 *
 * @param props - Component props.
 * @param props.isPrfMigration - Whether to replace an existing passkey with a
 * PRF-backed passkey.
 */
export default function SetupPasskeyContent({
  isPrfMigration = false,
  ...props
}: SetupPasskeyContentProps) {
  if (isPrfMigration) {
    return <PasskeyMigrationSetup {...props} />;
  }

  return <PasskeyEnrollmentSetup {...props} />;
}

/**
 * Runs first-time passkey enrollment through the shared setup view.
 *
 * @param props - Passkey setup props.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function PasskeyEnrollmentSetup(props: SetupPasskeyContentProps) {
  const { enrollWithPasskey } = usePasskeyEnrollment();

  return <PasskeySetupView {...props} setupPasskey={enrollWithPasskey} />;
}

/**
 * Runs PRF passkey replacement through the shared setup view.
 *
 * @param props - Passkey setup props.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function PasskeyMigrationSetup(props: SetupPasskeyContentProps) {
  const { replacePasskey } = usePasskeyPrfMigration();

  const setupPasskey: PasskeySetupOperation = useCallback(
    async ({ onStageChange }) => {
      await replacePasskey({
        onStageChange: (stage) => {
          if (stage === 'complete') {
            return;
          }

          onStageChange?.(stage);
        },
      });
    },
    [replacePasskey],
  );

  return (
    <PasskeySetupView {...props} isPrfMigration setupPasskey={setupPasskey} />
  );
}
