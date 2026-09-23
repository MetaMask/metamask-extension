import { useCallback } from 'react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import { bytesToString } from '@metamask/utils';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useMessenger } from '../useMessenger';

type PasskeySeedPhraseExportMessenger = RouteMessenger<
  'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
  never
>;

export function usePasskeySeedPhraseExport() {
  const messenger = useMessenger<PasskeySeedPhraseExportMessenger>();

  return useCallback(
    async (
      authenticationResponse: PasskeyAuthenticationResponse,
      keyringId?: string,
    ) => {
      const seedPhraseBytes = await messenger.call(
        'LegacyBackgroundApiService:exportSeedPhraseWithPasskey',
        { authenticationResponse, keyringId },
      );
      return bytesToString(new Uint8Array(seedPhraseBytes));
    },
    [messenger],
  );
}
