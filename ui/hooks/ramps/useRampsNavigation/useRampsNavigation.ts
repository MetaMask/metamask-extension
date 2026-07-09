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
  getRampsProviders,
  getRampsTokens,
} from '../../../selectors/ramps';
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
 * either shows a blocking modal or opens the buy destination.
 */
export default function useRampsNavigation() {
  const dispatch = useDispatch();
  const { openBuyCryptoInPdapp } = useRamps();

  const isEnabled = useSelector(getIsRampsEnabled);
  const isDisruption = useSelector(getIsRampsServiceDisruptionActive);
  const isGeoUnknown = useSelector(getIsRampsGeolocationUnknown);
  const isRegionUnsupported = useSelector(getIsRampRegionUnsupported);
  const providers = useSelector(getRampsProviders);
  const tokens = useSelector(getRampsTokens);

  const goToBuy = useCallback(
    (chainId?: ChainId | CaipChainId) => {
      // Rollout gate off → unchanged Portfolio behavior.
      if (!isEnabled) {
        openBuyCryptoInPdapp(chainId);
        return;
      }

      // 1. Geolocation unknown.
      if (isGeoUnknown) {
        dispatch(showModal({ name: 'RAMPS_ELIGIBILITY_FAILED' }));
        return;
      }
      // 2. Service-disruption kill-switch.
      if (isDisruption) {
        dispatch(showModal({ name: 'RAMPS_SERVICE_DISRUPTION' }));
        return;
      }
      // 3. Region definitively unsupported.
      if (isRegionUnsupported) {
        dispatch(showModal({ name: 'RAMPS_UNSUPPORTED' }));
        return;
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
          return;
        }
      }

      // 5. Proceed. Destination stays Portfolio until native pages (TRAM-3714+).
      openBuyCryptoInPdapp(chainId);
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
