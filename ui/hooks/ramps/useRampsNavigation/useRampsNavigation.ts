import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { CaipChainId } from '@metamask/utils';
import type { ChainId } from '../../../../shared/constants/network';
import { showModal } from '../../../store/actions';
import {
  getIsRampsEnabled,
  getIsRampsServiceDisruptionActive,
} from '../../../selectors/ramps-feature-flags';
import {
  getIsRampsGeolocationUnknown,
  getIsRampRegionUnsupported,
} from '../../../selectors/ramps';
import {
  selectProviders,
  selectTokens,
} from '../../../selectors/rampsController';
import useRamps from '../useRamps/useRamps';

/**
 * Provides the `goToBuy` navigation gate for the Ramps buy entry point.
 *
 * Runs a fixed 5-step geo-block gate (geolocation unknown, service
 * disruption, region unsupported, providers/tokens fetched-but-empty,
 * proceed) before falling through to the existing Portfolio redirect. The
 * gate is skipped entirely when the `rampsEnabled` rollout flag is off.
 *
 * @returns An object with `goToBuy`, a callback that runs the gate and
 * either shows a blocking modal or opens the buy destination. Returns
 * `true` if the buy destination was opened, `false` if blocked by a modal.
 */
export default function useRampsNavigation() {
  const dispatch = useDispatch();
  const { openBuyCryptoInPdapp } = useRamps();

  const isEnabled = useSelector(getIsRampsEnabled);
  const isDisruption = useSelector(getIsRampsServiceDisruptionActive);
  const isGeoUnknown = useSelector(getIsRampsGeolocationUnknown);
  const isRegionUnsupported = useSelector(getIsRampRegionUnsupported);
  const providers = useSelector(selectProviders);
  const tokens = useSelector(selectTokens);

  const goToBuy = useCallback(
    (chainId?: ChainId | CaipChainId) => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        openBuyCryptoInPdapp(chainId);
        return true;
      }

      // 1. Geolocation unknown.
      if (isGeoUnknown) {
        dispatch(showModal({ name: 'RAMPS_ELIGIBILITY_FAILED' }));
        return false;
      }
      // 2. Service-disruption kill-switch.
      if (isDisruption) {
        dispatch(showModal({ name: 'RAMPS_SERVICE_DISRUPTION' }));
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
      isGeoUnknown,
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
