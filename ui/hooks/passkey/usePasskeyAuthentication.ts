import { useCallback } from 'react';
import { startPasskeyAuthentication } from '../../../shared/lib/passkey';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';

type PasskeyAuthenticationMessenger = RouteMessenger<
  'PasskeyController:generateAuthenticationOptions',
  never
>;

export function usePasskeyAuthentication() {
  const messenger = useMessenger<PasskeyAuthenticationMessenger>();

  return useCallback(async () => {
    const authenticationOptions = await messenger.call(
      'PasskeyController:generateAuthenticationOptions',
    );
    return startPasskeyAuthentication(authenticationOptions);
  }, [messenger]);
}
