import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MONEY_REFERRAL_ROUTE,
  type MoneyReferralContext,
} from '../../../shared/lib/deep-links/money-referral';
import { parse } from '../../../shared/lib/deep-links/parse';
import { isDeepLinkHost } from '../../../shared/lib/deep-links/common';
import {
  buildInternalRoute,
  buildInterstitialRoute,
  getDestinationTarget,
} from '../../../shared/lib/deep-links/utils';
import { getCompletedOnboarding } from '../../ducks/metamask/metamask';
import { getIsUnlocked } from '../../ducks/metamask/base-selectors';
import {
  DEFAULT_ROUTE,
  ONBOARDING_ROUTE,
  UNLOCK_ROUTE,
} from '../../helpers/constants/routes';
import { useMessenger } from '../../hooks/useMessenger';
import { MoneyReferralContextAction } from '../../hooks/rewards/referral-context';
import {
  REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES,
  type RewardsMoneyInviteMessenger,
} from '../../hooks/rewards/rewards-money-messenger';
import { RouteMessengerProvider } from '../../contexts/route-messenger';
import { AcceptInviteSheet } from '../../components/app/rewards/money-referral/AcceptInviteSheet';
import { getShowTermsOfUse, getUseExternalServices } from '../../selectors';
import { useDispatch } from '../../store/hooks';
import { setTermsOfUseLastAgreed } from '../../store/actions';
import TermsOfUsePopup from '../../components/app/terms-of-use-popup/terms-of-use-popup';
import { useAnalytics } from '../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { selectSessionData } from '../../selectors/identity/authentication';

const MoneyReferralHandoffContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const messenger = useMessenger<RewardsMoneyInviteMessenger>();
  const completed = useSelector(getCompletedOnboarding);
  const unlocked = useSelector(getIsUnlocked);
  const termsOwed = useSelector(getShowTermsOfUse);
  const externalServices = useSelector(getUseExternalServices);
  const profileId = useSelector(selectSessionData)?.profile?.profileId;
  const offerProfileId = useRef<string>();
  const [context, setContext] = useState<MoneyReferralContext | null>(null);
  const [loaded, setLoaded] = useState(false);
  const finished = useRef(false);
  const takeRequest = useRef<{
    search: string;
    promise: Promise<MoneyReferralContext | null>;
  }>();

  const continueToDestination = useCallback(
    async (originalUrl: string, authorized: boolean) => {
      if (finished.current) {
        return;
      }
      finished.current = true;
      try {
        const url = new URL(originalUrl);
        if (!isDeepLinkHost(url.hostname)) {
          throw new Error('Unsupported deep-link host');
        }
        const parsed = await parse(url);
        if (!parsed) {
          throw new Error('Unsupported deep-link destination');
        }
        const target = getDestinationTarget(parsed.destination);
        // Losing in-memory context must never turn the handoff into a warning bypass.
        if (!authorized) {
          navigate(buildInterstitialRoute(url.pathname + url.search), {
            replace: true,
          });
        } else if (target.type === 'redirect') {
          window.location.assign(target.url.toString());
        } else {
          navigate(buildInternalRoute(target.path, target.queryString), {
            replace: true,
          });
        }
      } catch {
        navigate(DEFAULT_ROUTE, { replace: true });
      }
    },
    [navigate],
  );

  useEffect(() => {
    if (!completed || !unlocked || context) {
      return undefined;
    }
    let cancelled = false;
    const params = new URLSearchParams(location.search);
    // Reuse the atomic take across effect replay; a second take loses the offer.
    if (takeRequest.current?.search !== location.search) {
      takeRequest.current = {
        search: location.search,
        promise: messenger.call(
          MoneyReferralContextAction.take,
          params.get('context') ?? '',
        ),
      };
    }
    const pendingOffer = takeRequest.current.promise;
    const loadOffer = async () => {
      try {
        const offer = await pendingOffer;
        if (cancelled) {
          return;
        }
        if (offer && offer.canOffer !== false) {
          offerProfileId.current = profileId;
          setContext(offer);
        } else if (offer) {
          await continueToDestination(offer.url, true);
        } else {
          await continueToDestination(params.get('u') ?? '', false);
        }
        setLoaded(true);
      } catch {
        if (!cancelled) {
          await continueToDestination(params.get('u') ?? '', false);
        }
      }
    };
    loadOffer().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [
    completed,
    unlocked,
    context,
    profileId,
    location.search,
    messenger,
    continueToDestination,
  ]);

  const handleClose = useCallback(() => {
    if (!context || finished.current) {
      return;
    }
    messenger
      .call(MoneyReferralContextAction.answer, context.code)
      .catch(() => undefined);
    continueToDestination(context.url, true).catch(() => undefined);
  }, [context, continueToDestination, messenger]);

  useEffect(() => {
    if (!context) {
      return;
    }
    if (
      externalServices === false ||
      (offerProfileId.current && profileId !== offerProfileId.current)
    ) {
      handleClose();
    } else if (!offerProfileId.current) {
      offerProfileId.current = profileId;
    }
  }, [context, externalServices, profileId, handleClose]);

  const handleTermsAccepted = useCallback(() => {
    dispatch(setTermsOfUseLastAgreed(Date.now()));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.TermsOfUseAccepted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({ location: 'Terms Of Use Popover' })
        .build(),
    ).catch(() => undefined);
  }, [createEventBuilder, dispatch, trackEvent]);

  if (!completed) {
    return <Navigate to={ONBOARDING_ROUTE} replace />;
  }
  if (!unlocked) {
    return <Navigate to={UNLOCK_ROUTE} state={{ from: location }} replace />;
  }
  if (!loaded || !context) {
    return null;
  }
  if (termsOwed) {
    return <TermsOfUsePopup onAccept={handleTermsAccepted} />;
  }
  return (
    <AcceptInviteSheet
      initialCode={context.code}
      entryType={context.entryType}
      onClose={handleClose}
    />
  );
};

/** Hosts the invite after security/unlock, then resumes the original product route. */
export function MoneyReferralHandoff() {
  const { search } = useLocation();
  return (
    <RouteMessengerProvider
      path={MONEY_REFERRAL_ROUTE}
      capabilities={REWARDS_MONEY_INVITE_ALLOWED_CAPABILITIES}
    >
      <MoneyReferralHandoffContent key={search} />
    </RouteMessengerProvider>
  );
}
