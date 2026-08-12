import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import { useDispatch } from '../../store/hooks';
import {
  forceUpdateMetamaskState,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { useMessenger } from '../../hooks/useMessenger';
import type { UnlockRouteMessenger } from './messenger';

export function usePasskeyUnlock() {
  const dispatch = useDispatch();
  const messenger = useMessenger<UnlockRouteMessenger>();

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
