import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import { PASSKEY_PRF_MIGRATION_NOTICE_MAX_COUNT } from '../../../shared/constants/passkey';
import { getIsPasskeyUserHandleBased } from '../../selectors';
import { getPasskeyPrfMigrationNoticeCounter } from '../../ducks/metamask/metamask';
import type { RouteMessenger } from '../../messengers/route-messenger';
import { useAppSelector, useDispatch } from '../../store/hooks';
import {
  forceUpdateMetamaskState,
  hideLoadingIndication,
  showLoadingIndication,
} from '../../store/actions';
import { useMessenger } from '../useMessenger';

type PasskeyUnlockMessenger = RouteMessenger<
  | 'PasskeyController:generateAuthenticationOptions'
  | 'LegacyBackgroundApiService:unlockWithPasskey'
  | 'AppStateController:incrementPasskeyPrfMigrationNoticeCounter',
  never
>;

export function usePasskeyUnlock() {
  const dispatch = useDispatch();
  const messenger = useMessenger<PasskeyUnlockMessenger>();
  const isPasskeyMigrationEligible = useAppSelector(
    getIsPasskeyUserHandleBased,
  );
  const passkeyPrfMigrationNoticeCounter = useAppSelector(
    getPasskeyPrfMigrationNoticeCounter,
  );

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

      const shouldShowMigrationNotice =
        isPasskeyMigrationEligible &&
        passkeyPrfMigrationNoticeCounter <
          PASSKEY_PRF_MIGRATION_NOTICE_MAX_COUNT;

      if (shouldShowMigrationNotice) {
        await messenger.call(
          'AppStateController:incrementPasskeyPrfMigrationNoticeCounter',
        );
      }

      return shouldShowMigrationNotice;
    } finally {
      dispatch(hideLoadingIndication());
    }
  }, [
    dispatch,
    isPasskeyMigrationEligible,
    messenger,
    passkeyPrfMigrationNoticeCounter,
  ]);
}
