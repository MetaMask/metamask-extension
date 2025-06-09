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
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../contexts/metametrics';

const { getExtensionURL } = globalThis.platform;

export const DeepLink = () => {
  const trackEvent = useContext(MetaMetricsContext);
  const location = useLocation();
  const t = useI18nContext();
  const dispatch = useDispatch();
  // it'd technically not possible for a natural flow to reach this page
  // when `skipDeepLinkInterstitial` is true, but if a user manually navigates
  // to this "interstitial" page we should show their preferences anyway.
  const skipDeepLinkInterstitial = useSelector(
    (state: MetaMaskReduxState) =>
      getPreferences(state).skipDeepLinkInterstitial,
  );

  const [route, setRoute] = useState<null | {
    parsed: ParsedDeepLink;
    href: string;
    title: string;
    signed: boolean;
  }>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(skipDeepLinkInterstitial);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlStr = params.get('u');
    if (!urlStr) {
      setError('No url to navigate to was provided.');
      return;
    }

    async function parseUrlStr(urlPathAndQuery: string) {
      const fullUrlStr = `https://${DEEP_LINK_HOST}${urlPathAndQuery}`;
      try {
        const parsed = await parse(fullUrlStr);
        if (parsed) {
          const { normalizedUrl, destination, signed } = parsed;
          const { path, query } = destination;
          const href = getExtensionURL(path, query.toString() ?? null);
          const title =
            routes
              .get(normalizedUrl.pathname)
              ?.getTitle(normalizedUrl.searchParams) ?? '';

          setRoute({ parsed, href, title, signed });

          trackEvent({
            category: MetaMetricsEventCategory.DeepLink,
            event: MetaMetricsEventName.DeepLinkInterstitialViewed,
            properties: {
              route: normalizedUrl.pathname,
              signed,
            },
            sensitiveProperties: Object.fromEntries(
              normalizedUrl.searchParams.entries(),
            ),
          });
        } else {
          setError(
            'Provided URL is not a valid MetaMask deeplink or is malformed.',
          );
          setRoute(null);
        }
      } catch (e) {
        log.error('Error parsing deeplink:', e);
        setError('An error occurred while processing the deeplink.');
        setRoute(null);
      }
    }
    parseUrlStr(urlStr);
  }, [location.search]);

  async function onIntersticialDismissed(
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) {
    e.preventDefault();

    if (route) {
      trackEvent({
        category: MetaMetricsEventCategory.DeepLink,
        event: MetaMetricsEventName.DeepLinkInterstitialDismissed,
        properties: {
          route: route.parsed.normalizedUrl.pathname,
          signed: route.signed,
        },
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
          {route ? (
            ''
          ) : (
            <img
              className="loading-spinner"
              src="./images/spinner.gif"
              alt=""
            />
          )}
        </Box>
        {error ? (
          <Box className="error">
            <Text>{error}</Text>
          </Box>
        ) : (
          ''
        )}
        {route ? (
          <Box padding={4}>
            <Box margin={4}>
              <Text margin={4}>
                A previous action wants to navigate to a page within the
                MetaMask extension.
              </Text>
              {route.signed ? (
                ''
              ) : (
                <Text margin={4}>
                  You should only continue if you trust the source of this link.
                </Text>
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
                  isChecked={hasChecked}
                  onChange={onRemindMeStateChanged}
                ></Checkbox>
                <Label
                  htmlFor="dont-remind-me-checkbox"
                  fontWeight={FontWeight.Normal}
                  variant={TextVariant.bodySm}
                >
                  Don't remind me again
                </Label>
              </Box>
            ) : (
              ''
            )}
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
              >
                {t('cancel')}
              </Button>

              <Button
                variant={ButtonVariant.Primary}
                href={route.href}
                size={ButtonSize.Lg}
              >
                {t(route.title) ?? route.title}
              </Button>
            </Box>
          </Box>
        ) : (
          ''
        )}
      </>
    </Container>
  );
};
