import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';

type PasskeyVerifiedRemovalMessenger = RouteMessenger<
  | 'PasskeyController:generateAuthenticationOptions'
  | 'PasskeyController:removePasskeyWithPasskeyVerification',
  never
>;

type PasswordVerifiedRemovalMessenger = RouteMessenger<
  'PasskeyController:removePasskeyWithPasswordVerification',
  never
>;

export function useRemovePasskeyWithPasskey() {
  const messenger = useMessenger<PasskeyVerifiedRemovalMessenger>();

  useEffect(
    () => () => {
      cancelPasskeyCeremony();
    },
    [],
  );

  return useCallback(async () => {
    const authenticationOptions = await messenger.call(
      'PasskeyController:generateAuthenticationOptions',
    );
    const authenticationResponse = await startPasskeyAuthentication(
      authenticationOptions,
    );
    await messenger.call(
      'PasskeyController:removePasskeyWithPasskeyVerification',
      authenticationResponse,
    );
  }, [messenger]);
}

export function useRemovePasskeyWithPassword() {
  const messenger = useMessenger<PasswordVerifiedRemovalMessenger>();

  return useCallback(
    (password: string) =>
      messenger.call(
        'PasskeyController:removePasskeyWithPasswordVerification',
        password,
      ),
    [messenger],
  );
}
