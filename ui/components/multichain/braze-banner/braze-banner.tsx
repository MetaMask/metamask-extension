import React from 'react';
import { BRAZE_BANNER_HOME_PLACEMENT_ID } from '../../../../shared/lib/braze';
import { RouteMessengerProvider } from '../../../contexts/route-messenger';
import { BrazeBannerCard } from './braze-banner-card';
import { BRAZE_BANNER_ALLOWED_CAPABILITIES } from './braze-banner-messenger';
import { useBrazeBanner } from './use-braze-banner';

const BrazeBannerContent = () => {
  const { banner, onClick, onDismiss } = useBrazeBanner(
    BRAZE_BANNER_HOME_PLACEMENT_ID,
  );

  if (!banner?.body) {
    return null;
  }

  return (
    <BrazeBannerCard
      title={banner.title}
      body={banner.body}
      imageUrl={banner.imageUrl}
      ctaLabel={banner.ctaLabel}
      onClick={banner.deeplink ? onClick : undefined}
      onDismiss={onDismiss}
    />
  );
};

/**
 * The Braze campaign banner on the wallet home. Renders nothing until the
 * background returns a banner for the signed-in user.
 */
export const BrazeBanner = () => (
  <RouteMessengerProvider
    path="braze-banner-home"
    capabilities={BRAZE_BANNER_ALLOWED_CAPABILITIES}
  >
    <BrazeBannerContent />
  </RouteMessengerProvider>
);
