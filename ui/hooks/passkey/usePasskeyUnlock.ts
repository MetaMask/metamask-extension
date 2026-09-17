import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useDispatch } from '../../store/hooks';
import {
  forceUpdateMetamaskState,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { useMessenger } from '../useMessenger';

type PasskeyUnlockMessenger = RouteMessenger<
  | 'PasskeyController:generateAuthenticationOptions'
  | 'LegacyBackgroundApiService:unlockWithPasskey',
  never
>;

export function usePasskeyUnlock() {
  const dispatch = useDispatch();
  const messenger = useMessenger<PasskeyUnlockMessenger>();

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

    dispatch(showLoadingIndication());
    try {
      await messenger.call(
        'LegacyBackgroundApiService:unlockWithPasskey',
        authenticationResponse,
      );
      await forceUpdateMetamaskState(dispatch);
    } finally {
      dispatch(hideLoadingIndication());
    }
  }, [dispatch, messenger]);
}
