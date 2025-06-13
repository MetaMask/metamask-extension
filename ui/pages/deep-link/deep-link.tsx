import React, { useEffect, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import log from 'loglevel';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../components/component-library/button';
import {
  parse,
  type ParsedDeepLink,
} from '../../../shared/lib/deep-links/parse';
import { routes } from '../../../shared/lib/deep-links/routes';
import { DEEP_LINK_HOST } from '../../../shared/lib/deep-links/constants';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library/text/text';
import { Box } from '../../components/component-library/box/box';
import { BaseUrl } from '../../../shared/constants/urls';
import { Container } from '../../components/component-library/container/container';
import { ContainerMaxWidth, Label } from '../../components/component-library';
import { Checkbox } from '../../components/component-library/checkbox/checkbox';
import { setSkipDeepLinkInterstitial } from '../../store/actions';
import { getPreferences } from '../../selectors/selectors';
import { MetaMaskReduxState } from '../../store/store';
import {
  MetaMetricsContext,
  type UITrackEventMethod,
} from '../../contexts/metametrics';
import { trackDismissed, trackView } from './metrics';

type TranslateFunction = (key: string, substitutions?: string[]) => string;

type Route = {
  parsed: ParsedDeepLink;
  href: string;
  title: string;
  signed: boolean;
};

const { getExtensionURL } = globalThis.platform;

/**
 * Updates the state based on the URL path and query. This function parses the
 * URL, retrieves the route, and sets the route and error state accordingly.
 *
 * @param urlPathAndQuery - The URL path and query string to parse. (relative to its origin, i.e., /home?utm_source=foo)
 * @param setRoute - The function to call to set the route state.
 * @param setError - The function to call to set the error state.
 * @param trackEvent - The function to call to track events.
 * @param t - The translation function.
 */
async function updateStateFromUrl(
  urlPathAndQuery: string,
  setRoute: React.Dispatch<React.SetStateAction<Route | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  trackEvent: UITrackEventMethod,
  t: TranslateFunction,
) {
  const fullUrlStr = `https://${DEEP_LINK_HOST}${urlPathAndQuery}`;
  try {
    const parsed = await parse(fullUrlStr);
    if (parsed) {
      const { normalizedUrl, destination, signed } = parsed;
      const { path, query } = destination;
      const href = getExtensionURL(path, query.toString() ?? null);
      const route = routes.get(normalizedUrl.pathname);
      if (route) {
        const title = route.getTitle(normalizedUrl.searchParams);

        setRoute({ parsed, href, title, signed });
        trackView(trackEvent, { url: normalizedUrl, signed });
      }
    } else {
      setError(t('deepLink_ErrorParsingUrl'));
      setRoute(null);
    }
  } catch (e) {
    log.error('Error parsing deep link:', e);
    setError(t('deepLink_ErrorOther'));
    setRoute(null);
  }
}

export const DeepLink = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const location = useLocation();
  const t = useI18nContext() as TranslateFunction;
  const dispatch = useDispatch();
  // it'd technically not possible for a natural flow to reach this page
  // when `skipDeepLinkInterstitial` is true, but if a user manually navigates
  // to this "interstitial" page we should show their preferences anyway.
  const skipDeepLinkInterstitial = useSelector(
    (state: MetaMaskReduxState) =>
      getPreferences(state).skipDeepLinkInterstitial,
  );

  const [route, setRoute] = useState<null | Route>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(skipDeepLinkInterstitial);
  const isLoading = !route && !error;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlStr = params.get('u');
    if (!urlStr) {
      const errorCode = params.get('errorCode');
      if (errorCode === '404') {
        setError(t('deepLink_Error404'));
      } else {
        setError(t('deepLink_ErrorMissingUrl'));
      }
      return;
    }

    updateStateFromUrl(urlStr, setRoute, setError, trackEvent, t);
  }, [location.search]);

  async function onIntersticialDismissed(
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) {
    e.preventDefault();

    if (route) {
      await trackDismissed(trackEvent, {
        url: route.parsed.normalizedUrl,
        signed: route.signed,
      });
    }

    if (window.history.length > 1) {
      // If there is a history, go back to the previous page
      // TODO: this has so many ways it won't work and leave the user frustrated. Revisit this idea.
      window.history.back();
    } else {
      // If there is no history, redirect to https://metamask.io/
      window.location.href = BaseUrl.MetaMask;
    }
  }

  function onRemindMeStateChanged() {
    const newHasChecked = !hasChecked;
    setHasChecked(newHasChecked);
    dispatch(setSkipDeepLinkInterstitial(newHasChecked));
  }

  return (
    <Container maxWidth={ContainerMaxWidth.Lg} textAlign={TextAlign.Center}>
      <>
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <img className="loading-logo" src="./images/logo/metamask-fox.svg" />
          {isLoading && (
            <img
              data-testid="loading-indicator"
              className="loading-spinner"
              src="./images/spinner.gif"
              alt=""
            />
          )}
        </Box>
        {error && (
          <Box padding={4} className="error" data-testid="deep-link-error">
            <Text>{error}</Text>
          </Box>
        )}
        {route && (
          <Box padding={4} data-testid="deep-link-route">
            <Box margin={4}>
              <Text margin={4}>{t('deepLink_YouAreAboutToOpen')}</Text>
              {route.signed ? (
                ''
              ) : (
                <Text margin={4}>{t('deepLink_ContinueWarning')}</Text>
              )}
            </Box>
            {route.signed ? (
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.center}
                alignItems={AlignItems.center}
                gap={2}
                margin={4}
              >
                <Checkbox
                  id="dont-remind-me-checkbox"
                  data-testid="deep-link-checkbox"
                  isChecked={hasChecked}
                  onChange={onRemindMeStateChanged}
                ></Checkbox>
                <Label
                  htmlFor="dont-remind-me-checkbox"
                  fontWeight={FontWeight.Normal}
                  variant={TextVariant.bodySm}
                >
                  {t('deepLink_DontRemindMeAgain')}
                </Label>
              </Box>
            ) : (
              ''
            )}
          </Box>
        )}

        {!isLoading && (
          <Box
            display={Display.Flex}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
            padding={4}
          >
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Secondary}
              onClick={onIntersticialDismissed}
              data-testid="deep-link-cancel-button"
            >
              {t('cancel')}
            </Button>

            <Button
              variant={ButtonVariant.Primary}
              href={route?.href ?? getExtensionURL('/')}
              size={ButtonSize.Lg}
              data-testid="deep-link-continue-button"
            >
              {t(route?.title || 'deepLink_OpenTheHomePage')}
            </Button>
          </Box>
        )}
      </>
    </Container>
  );
};
