import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import log from 'loglevel';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../components/component-library/button';
import { parse } from '../../../shared/lib/deep-links/parse';
import { DEEP_LINK_HOST } from '../../../shared/lib/deep-links/constants';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library/text/text';
import { Box } from '../../components/component-library/box/box';
import { Container } from '../../components/component-library/container/container';
import { ContainerMaxWidth, Label } from '../../components/component-library';
import { Checkbox } from '../../components/component-library/checkbox/checkbox';
import { setSkipDeepLinkInterstitial } from '../../store/actions';
import { getPreferences } from '../../selectors/selectors';
import { MetaMaskReduxState } from '../../store/store';
import { VALID } from '../../../shared/lib/deep-links/verify';

type TranslateFunction = (
  key: string,
  substitutions?: (string | React.JSX.Element)[],
) => string;

type Route = {
  href: string;
  signed: boolean;
};

const { getExtensionURL } = globalThis.platform;

function set404(
  setDescription: React.Dispatch<React.SetStateAction<string | null>>,
  setTitle: React.Dispatch<React.SetStateAction<string | null>>,
  t: TranslateFunction,
) {
  setDescription(t('deepLink_Error404Description'));
  setTitle(t('deepLink_Error404Title'));
}

/**
 * Updates the state based on the URL path and query. This function parses the
 * URL, retrieves the route, and sets the route and error state accordingly.
 *
 * @param urlPathAndQuery - The URL path and query string to parse. (relative to its origin, i.e., /home?utm_source=foo)
 * @param setDescription - The function to call to set the description state.
 * @param setIsLoading - The function to call to set the loading state.
 * @param setRoute - The function to call to set the route state.
 * @param setTitle - The function to call to set the title state.
 * @param setCta - The function to call to set the call-to-action state.
 * @param t - The translation function.
 */
async function updateStateFromUrl(
  urlPathAndQuery: string,
  setDescription: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setRoute: React.Dispatch<React.SetStateAction<Route | null>>,
  setTitle: React.Dispatch<React.SetStateAction<string | null>>,
  setCta: React.Dispatch<React.SetStateAction<string | null>>,
  t: TranslateFunction,
) {
  try {
    const fullUrlStr = `https://${DEEP_LINK_HOST}${urlPathAndQuery}`;
    const url = new URL(fullUrlStr);
    setIsLoading(true);
    const parsed = await parse(url);
    if (parsed) {
      const { destination } = parsed;

      if ('redirectTo' in destination) {
        window.location.href = destination.redirectTo.toString();
        return;
      }

      const { path, query } = destination;
      const href = getExtensionURL(path, query.toString() ?? null);
      const title = parsed.route.getTitle(url.searchParams);

      const signed = parsed.signature === VALID;
      const continueMessage = t('deepLink_ContinueDescription', [t(title)]);
      const description = signed
        ? continueMessage
        : t('deepLink_ThirdPartyDescription', [continueMessage]);
      setDescription(description);
      setRoute({ href, signed });
      setTitle(
        signed ? t('deepLink_RedirectingToMetaMask') : t('deepLink_Caution'),
      );
      setCta(t('deepLink_Continue', [t(title)]));
    } else {
      setRoute(null);
      set404(setDescription, setTitle, t);
      setCta(t('deepLink_GoToTheHomePageButton'));
    }
  } catch (e) {
    log.error('Error parsing deep link:', e);
    setDescription(t('deepLink_ErrorOtherDescription'));
    setRoute(null);
    setTitle(t('deepLink_ErrorOtherTitle'));
    setCta(t('deepLink_GoToTheHomePageButton'));
  } finally {
    setIsLoading(false);
  }
}

export const DeepLink = () => {
  const location = useLocation();
  const t = useI18nContext() as TranslateFunction;
  const dispatch = useDispatch();
  // it's technically not possible for a natural flow to reach this page
  // when `skipDeepLinkInterstitial` is true, but if a user manually navigates
  // to this "interstitial" page, or uses their back button, we should show
  // their previously selected preference.
  const skipDeepLinkInterstitial = useSelector(
    (state: MetaMaskReduxState) =>
      getPreferences(state).skipDeepLinkInterstitial,
  );

  const [description, setDescription] = useState<string | null>(null);
  const [route, setRoute] = useState<null | Route>(null);
  const [title, setTitle] = useState<null | string>(null);
  const [cta, setCta] = useState<null | string>(null);
  const [skipDeepLinkInterstitialChecked, setSkipDeepLinkInterstitialChecked] =
    useState(skipDeepLinkInterstitial);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlStr = params.get('u');
    if (!urlStr) {
      const errorCode = params.get('errorCode');
      setRoute(null);
      setIsLoading(false);
      if (errorCode === '404') {
        set404(setDescription, setTitle, t);
      } else {
        setDescription(null);
        setTitle(t('deepLink_ErrorMissingUrl'));
      }
      setCta(t('deepLink_GoToTheHomePageButton'));
      return;
    }

    updateStateFromUrl(
      urlStr,
      setDescription,
      setIsLoading,
      setRoute,
      setTitle,
      setCta,
      t,
    );
  }, [location.search]);

  function onRemindMeStateChanged() {
    const newValue = !skipDeepLinkInterstitialChecked;
    setSkipDeepLinkInterstitialChecked(newValue);
    dispatch(setSkipDeepLinkInterstitial(newValue));
  }

  return (
    <Container
      maxWidth={ContainerMaxWidth.Sm}
      textAlign={TextAlign.Center}
      marginLeft={6}
      marginRight={6}
      marginBottom={8}
    >
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
        {!isLoading && (
          <>
            {title && (
              <Text
                as="h1"
                variant={TextVariant.headingLg}
                fontWeight={FontWeight.Medium}
                marginTop={12}
                marginBottom={8}
              >
                {title}
              </Text>
            )}
            {description && (
              <Box
                as="p"
                data-testid="deep-link-description"
                paddingBottom={12}
              >
                {description}
              </Box>
            )}

            <Box marginTop={12}>
              {route?.signed ? (
                <Box
                  display={Display.Flex}
                  textAlign={TextAlign.Left}
                  gap={2}
                  padding={3}
                  marginBottom={6}
                  borderRadius={BorderRadius.XL}
                  backgroundColor={BackgroundColor.backgroundMuted}
                >
                  <Checkbox
                    id="dont-remind-me-checkbox"
                    data-testid="deep-link-checkbox"
                    isChecked={skipDeepLinkInterstitialChecked}
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
              <Button
                width={BlockSize.Full}
                variant={ButtonVariant.Primary}
                href={route?.href ?? getExtensionURL('/')}
                size={ButtonSize.Lg}
                data-testid="deep-link-continue-button"
              >
                {cta}
              </Button>
            </Box>
          </>
        )}
      </>
    </Container>
  );
};
