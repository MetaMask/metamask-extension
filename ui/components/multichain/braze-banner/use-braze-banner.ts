import { useCallback, useEffect, useState } from 'react';
import type { BrazeBanner } from '../../../../shared/lib/braze';
import { captureException } from '../../../../shared/lib/sentry';
import { useMessenger } from '../../../hooks/useMessenger';
import type { BrazeBannerMessenger } from './braze-banner-messenger';

export type UseBrazeBannerResult = {
  /** The banner to render, or `null`. Never a control banner. */
  banner: BrazeBanner | null;
  onClick: () => void;
  onDismiss: () => void;
};

/**
 * Load the banner for a placement once on mount.
 *
 * The impression is logged as soon as the banner is received, including for
 * control banners, which render nothing. A banner that arrives after the
 * background gave up waiting for Braze is shown on the next mount instead.
 *
 * @param placementId - The placement ID.
 * @returns The banner and its interaction handlers.
 */
export function useBrazeBanner(placementId: string): UseBrazeBannerResult {
  const messenger = useMessenger<BrazeBannerMessenger>();
  const [banner, setBanner] = useState<BrazeBanner | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      const result = await messenger.call(
        'BrazeService:getBanner',
        placementId,
      );
      if (cancelled || !result) {
        return;
      }

      if (!result.isControl) {
        setBanner(result);
      }
      await messenger.call(
        'BrazeService:logBannerImpression',
        placementId,
        result.id,
      );
    };
    loadBanner().catch(captureException);

    return () => {
      cancelled = true;
    };
  }, [messenger, placementId]);

  const onClick = useCallback(() => {
    if (!banner?.deeplink) {
      return;
    }

    messenger
      .call('BrazeService:logBannerClick', placementId, banner.id)
      .catch(captureException);
    // Banner links are MetaMask universal links, so the deep-link router
    // handles them, including its interstitial.
    global.platform.openTab({ url: banner.deeplink });
  }, [banner, messenger, placementId]);

  const onDismiss = useCallback(() => {
    if (!banner) {
      return;
    }

    setBanner(null);
    messenger
      .call('BrazeService:dismissBanner', placementId, banner.id)
      .catch(captureException);
  }, [banner, messenger, placementId]);

  return { banner, onClick, onDismiss };
}
