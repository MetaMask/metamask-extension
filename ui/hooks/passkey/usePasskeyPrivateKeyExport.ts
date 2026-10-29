import { useCallback } from 'react';
import type { PasskeyAuthenticationResponse } from '@metamask/passkey-controller';
import type { RouteMessenger } from '../../messengers/route-messenger';
import {
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { useDispatch } from '../../store/hooks';
import { useMessenger } from '../useMessenger';

type PasskeyPrivateKeyExportMessenger = RouteMessenger<
  'PasskeyController:exportAccountsWithPasskey',
  never
>;

export function usePasskeyPrivateKeyExport() {
  const dispatch = useDispatch();
  const messenger = useMessenger<PasskeyPrivateKeyExportMessenger>();

  return useCallback(
    async (
      authenticationResponse: PasskeyAuthenticationResponse,
      addresses: string[],
    ) => {
      dispatch(showLoadingIndication());
      try {
        return await messenger.call(
          'PasskeyController:exportAccountsWithPasskey',
          authenticationResponse,
          addresses,
        );
      } finally {
        dispatch(hideLoadingIndication());
      }
    },
    [dispatch, messenger],
  );
}
