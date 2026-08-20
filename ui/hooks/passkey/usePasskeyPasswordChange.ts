import { useCallback } from 'react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';

type PasskeyPasswordChangeMessenger = RouteMessenger<
  'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
  never
>;

type ChangePasswordWithPasskeyParams = {
  newPassword: string;
  authenticationResponse: PasskeyAuthenticationResponse;
  options: { renewVaultKeyProtection: boolean };
};

export function usePasskeyPasswordChange() {
  const messenger = useMessenger<PasskeyPasswordChangeMessenger>();

  return useCallback(
    (params: ChangePasswordWithPasskeyParams) =>
      messenger.call(
        'LegacyBackgroundApiService:changePasswordWithPasskeyVerification',
        params,
      ),
    [messenger],
  );
}
