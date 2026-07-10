import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import { UNKNOWN_LOCATION } from '@metamask/geolocation-controller';
import type { ChainId } from '../../../../shared/constants/network';
import { showModal } from '../../../store/actions';
import { submitRequestToBackground } from '../../../store/background-connection';
import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from '../../../selectors/ramps-feature-flags';
import { getIsRampRegionUnsupported } from '../../../selectors/ramps';
import {
  selectProviders,
  selectTokens,
} from '../../../selectors/rampsController';
import useRamps from '../useRamps/useRamps';

/**
 * Provides the `goToBuy` navigation gate for the Ramps buy entry point.
 *
 * Runs a fixed geo-block gate (service disruption, geolocation unknown, region
 * unsupported, providers/tokens fetched-but-empty, proceed) before falling
 * through to the existing Portfolio redirect. The gate is skipped entirely when
 * the `rampsEnabled` rollout flag is off.
 *
 * Geolocation is resolved on demand via the background `GeolocationController`
 * (mobile parity — it does not fetch at startup, so reading synced state alone
 * would fail closed). Any loading/indeterminate state fails open; only a
 * settled, definitively-blocking state raises a modal.
 *
 * @returns An object with `goToBuy`, an async callback that runs the gate and
 * either shows a blocking modal or opens the buy destination. Resolves to
 * `true` when it proceeded (buy destination opened) and `false` when a blocking
 * modal was shown, so callers can gate follow-up UI (e.g. a "tab opened" toast).
 */
export default function useRampsNavigation() {
  const dispatch = useDispatch();
  const { openBuyCryptoInPdapp } = useRamps();

  const isEnabled = useSelector(getIsRampsEnabled);
  const isDisruption = useSelector(getIsRampsServiceDisruptionActive);
  const isRegionUnsupported = useSelector(getIsRampRegionUnsupported);
  const providers = useSelector(selectProviders);
  const tokens = useSelector(selectTokens);

  const goToBuy = useCallback(
    async (chainId?: ChainId | CaipChainId): Promise<boolean> => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        openBuyCryptoInPdapp(chainId);
        return true;
      }

      // 1. Service-disruption kill-switch — takes precedence over everything
      // below (mobile parity).
      if (isDisruption) {
        dispatch(showModal({ name: 'RAMPS_SERVICE_DISRUPTION' }));
        return false;
      }

      // 2. Geolocation unknown. Resolve on demand via the GeolocationController
      // (it does not fetch at startup, so reading synced state alone would
      // report UNKNOWN and fail closed). A settled `UNKNOWN`/failed lookup means
      // we cannot verify the user's location → EligibilityFailed.
      let location: string | undefined;
      try {
        location = await submitRequestToBackground<string>('getGeolocation');
      } catch {
        location = undefined;
      }
      if (!location || location === UNKNOWN_LOCATION) {
        dispatch(showModal({ name: 'RAMPS_ELIGIBILITY_FAILED' }));
        return false;
      }

      // 3. Region definitively unsupported.
      if (isRegionUnsupported) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return false;
      }

      // 4. Providers/tokens fetched but empty. `tokens.data === null` means
      // providers/tokens haven't been fetched yet (fetched together by the
      // native flow), so fail open and skip this check entirely until then.
      if (tokens.data !== null) {
        const providersEmpty =
          !providers.isLoading && providers.data.length === 0;
        const tokensEmpty =
          !tokens.isLoading &&
          (tokens.data.topTokens?.length ?? 0) === 0 &&
          (tokens.data.allTokens?.length ?? 0) === 0;
        if (providersEmpty || tokensEmpty) {
          dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
          return false;
        }
      }

      // 5. Proceed. Destination stays Portfolio until native pages (TRAM-3714+).
      openBuyCryptoInPdapp(chainId);
      return true;
    },
    [
      isEnabled,
      isDisruption,
      isRegionUnsupported,
      providers,
      tokens,
      dispatch,
      openBuyCryptoInPdapp,
    ],
  );

  return { goToBuy };
}
