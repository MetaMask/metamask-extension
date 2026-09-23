import { useCallback, useEffect } from 'react';
import {
  cancelPasskeyCeremony,
  startPasskeyAuthentication,
} from '../../../shared/lib/passkey';
import { WEEK } from '../../../shared/constants/time';
import { getIsPasskeyUserHandleBased } from '../../selectors';
import { getLastShownPrfMigrationReminderAt } from '../../ducks/metamask/metamask';
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
  | 'AppStateController:setLastShownPrfMigrationReminderAt',
  never
>;

export function usePasskeyUnlock() {
  const dispatch = useDispatch();
  const messenger = useMessenger<PasskeyUnlockMessenger>();
  const isPasskeyMigrationEligible = useAppSelector(
    getIsPasskeyUserHandleBased,
  );
  const lastShownPrfMigrationReminderAt = useAppSelector(
    getLastShownPrfMigrationReminderAt,
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

      const now = Date.now();
      const shouldShowMigrationNotice =
        isPasskeyMigrationEligible &&
        (lastShownPrfMigrationReminderAt === null ||
          now - lastShownPrfMigrationReminderAt >= WEEK);

      if (shouldShowMigrationNotice) {
        await messenger.call(
          'AppStateController:setLastShownPrfMigrationReminderAt',
          now,
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
    lastShownPrfMigrationReminderAt,
  ]);
}
