import { useCallback, useEffect, useRef } from 'react';
import type {
  PasskeyAuthenticationResponse,
  PasskeyRegistrationResponse,
} from '@metamask/passkey-controller';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
  startPasskeyRegistration,
} from '../../../shared/lib/passkey';
import {
  hasPasskeyPRFResult,
  PasskeyPRFRequiredError,
} from '../../../shared/lib/passkey/passkey-capabilities';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';

type PasskeyReplacementMessenger = RouteMessenger<
  | 'PasskeyController:generatePasskeyReplacementRegistrationOptions'
  | 'PasskeyController:generatePostRegistrationAuthenticationOptions'
  | 'PasskeyController:completePasskeyReplacement'
  | 'PasskeyController:cancelPasskeyReplacement',
  never
>;

export type PasskeyReplacementStage = 'register' | 'verify' | 'complete';

export type ReplacePasskeyParams = {
  password?: string;
  onStageChange?: (stage: PasskeyReplacementStage) => void;
};

/**
 * Runs the controller-owned userHandle-to-PRF replacement ceremony.
 *
 * The controller keeps the existing record active until the replacement is
 * complete. This hook owns the browser ceremonies and removes the staged
 * replacement ceremony when the browser flow is abandoned.
 */
export function usePasskeyReplacement() {
  const messenger = useMessenger<PasskeyReplacementMessenger>();
  const activeRegistrationChallenge = useRef<string | null>(null);
  const isUnmounted = useRef(false);

  const cancelActiveReplacement = useCallback(async () => {
    const challenge = activeRegistrationChallenge.current;
    if (!challenge) {
      return;
    }

    activeRegistrationChallenge.current = null;
    await messenger
      .call('PasskeyController:cancelPasskeyReplacement', challenge)
      .catch(() => undefined);
  }, [messenger]);

  useEffect(() => {
    isUnmounted.current = false;

    return () => {
      isUnmounted.current = true;
      cancelPasskeyCeremony();
      cancelActiveReplacement().catch(() => undefined);
    };
  }, [cancelActiveReplacement]);

  const replacePasskey = useCallback(
    async ({ password, onStageChange }: ReplacePasskeyParams = {}) => {
      onStageChange?.('register');

      const registrationOptions = await messenger.call(
        'PasskeyController:generatePasskeyReplacementRegistrationOptions',
      );
      if (isUnmounted.current) {
        await cancelActiveReplacement();
        return;
      }
      activeRegistrationChallenge.current = registrationOptions.challenge;

      try {
        const registrationResponse: PasskeyRegistrationResponse =
          await startPasskeyRegistration(registrationOptions);
        if (isUnmounted.current) {
          await cancelActiveReplacement();
          return;
        }

        onStageChange?.('verify');
        const authenticationOptions = await messenger.call(
          'PasskeyController:generatePostRegistrationAuthenticationOptions',
          { registrationResponse },
        );
        if (isUnmounted.current) {
          await cancelActiveReplacement();
          return;
        }
        const authenticationResponse: PasskeyAuthenticationResponse =
          await startPasskeyAuthentication(authenticationOptions);
        if (isUnmounted.current) {
          await cancelActiveReplacement();
          return;
        }

        if (!hasPasskeyPRFResult(authenticationResponse)) {
          throw new PasskeyPRFRequiredError();
        }

        await messenger.call('PasskeyController:completePasskeyReplacement', {
          registrationResponse,
          authenticationResponse,
          password,
        });
        activeRegistrationChallenge.current = null;
        onStageChange?.('complete');
      } catch (error) {
        await cancelActiveReplacement();
        throw error;
      }
    },
    [cancelActiveReplacement, messenger],
  );

  return { replacePasskey };
}
