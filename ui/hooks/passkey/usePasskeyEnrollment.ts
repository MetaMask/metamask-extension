import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  isPasskeyPRFSupported,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from '../../../shared/lib/passkey';
import {
  PASSKEY_STAGES,
  type PasskeyStage,
} from '../../../shared/constants/passkey';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';
import {
  hasPasskeyPRFResult,
  PasskeyPRFRequiredError,
} from '../../../shared/lib/passkey/passkey-capabilities';

type PasskeyEnrollmentMessenger = RouteMessenger<
  | 'PasskeyController:generateRegistrationOptions'
  | 'PasskeyController:generatePostRegistrationAuthenticationOptions'
  | 'PasskeyController:protectVaultKeyWithPasskey',
  never
>;

type EnrollWithPasskeyParams = {
  password?: string;
  onStageChange?: (stage: PasskeyStage) => void;
};

export function usePasskeyEnrollment() {
  const messenger = useMessenger<PasskeyEnrollmentMessenger>();

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  const enrollWithPasskey = useCallback(
    async ({ password, onStageChange }: EnrollWithPasskeyParams = {}) => {
      onStageChange?.(PASSKEY_STAGES.REGISTER);
      const prfSupported = await isPasskeyPRFSupported();
      const registrationOptions = await messenger.call(
        'PasskeyController:generateRegistrationOptions',
        { prfAvailable: prfSupported !== false },
      );
      const registrationResponse =
        await startPasskeyRegistration(registrationOptions);

      onStageChange?.(PASSKEY_STAGES.VERIFY);
      const authenticationOptions = await messenger.call(
        'PasskeyController:generatePostRegistrationAuthenticationOptions',
        { registrationResponse },
      );
      const authenticationResponse = await startPasskeyAuthentication(
        authenticationOptions,
      );

      if (!hasPasskeyPRFResult(authenticationResponse)) {
        throw new PasskeyPRFRequiredError();
      }

      onStageChange?.(PASSKEY_STAGES.ENROLL);
      await messenger.call('PasskeyController:protectVaultKeyWithPasskey', {
        registrationResponse,
        authenticationResponse,
        password,
      });
    },
    [messenger],
  );

  return { enrollWithPasskey };
}
