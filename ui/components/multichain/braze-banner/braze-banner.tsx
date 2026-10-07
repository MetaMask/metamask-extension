import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import * as braze from '@braze/web-sdk';
import { captureException } from '../../../../shared/lib/sentry';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import { getUseExternalServices } from '../../../selectors';
import {
  selectCanonicalProfileId,
  selectIsSignedIn,
} from '../../../selectors/identity/authentication';
import { selectBrazeBannerHomeEnabled } from '../../../selectors/braze';
import { BRAZE_BANNER_HOME_PLACEMENT_ID } from '../../../helpers/braze/banner-constants';
import { useBrazeBanner } from '../../../helpers/braze/use-braze-banner';
import { getBrazeBannerContent } from '../../../helpers/braze/banner-properties';
import { logBrazeBannerImpression } from '../../../helpers/braze/banner-analytics';
import { isAllowedBrazeBannerLink } from '../../../helpers/braze/is-allowed-banner-link';
import { BrazeBannerCard } from './braze-banner-card';

const IdentifiedBrazeBanner = ({ profileId }: { profileId: string }) => {
  const { banner, status, dismiss } = useBrazeBanner(
    BRAZE_BANNER_HOME_PLACEMENT_ID,
    profileId,
  );
  const impressedIds = useRef(new Set<string>());
  const content = banner ? getBrazeBannerContent(banner) : null;
  const deeplink = content?.deeplink;
  const allowedLink = Boolean(deeplink && isAllowedBrazeBannerLink(deeplink));

  useEffect(() => {
    if (
      status === 'visible' &&
      banner &&
      !impressedIds.current.has(banner.id)
    ) {
      impressedIds.current.add(banner.id);
      logBrazeBannerImpression(banner);
    }
  }, [banner, status]);

  const handleClick = useCallback(() => {
    if (!banner || !deeplink || !isAllowedBrazeBannerLink(deeplink)) {
      return;
    }
    try {
      braze.logBannerClick(banner);
      // Open the universal link through the regular external navigation flow.
      // Do not resolve to an internal route or mark Braze as a trusted origin.
      global.platform.openTab({ url: deeplink });
    } catch (error) {
      captureException(error);
    }
  }, [banner, deeplink]);

  if (status !== 'visible' || !content?.body) {
    return null;
  }
  return (
    <BrazeBannerCard
      {...content}
      body={content.body}
      onClick={allowedLink ? handleClick : undefined}
      onDismiss={dismiss}
    />
  );
};

/** Home banner gated on rollout, consent, unlock, and canonical Profile Sync identity. */
export function BrazeBanner() {
  const enabled = useSelector(selectBrazeBannerHomeEnabled);
  const unlocked = useSelector(getIsUnlocked);
  const externalServices = useSelector(getUseExternalServices);
  const signedIn = useSelector(selectIsSignedIn);
  const profileId = useSelector(selectCanonicalProfileId);

  return enabled && unlocked && externalServices && signedIn && profileId ? (
    <IdentifiedBrazeBanner key={profileId} profileId={profileId} />
  ) : null;
}
