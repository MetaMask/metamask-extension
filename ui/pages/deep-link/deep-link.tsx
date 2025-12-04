import React, { useEffect, useRef, useState } from 'react';
import type { Location as RouterLocation } from 'react-router-dom-v5-compat';
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
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library/text/text';
import { Box } from '../../components/component-library/box/box';
import { Container } from '../../components/component-library/container/container';
import { ButtonLink, Label } from '../../components/component-library';
import { Checkbox } from '../../components/component-library/checkbox/checkbox';
import { setSkipDeepLinkInterstitial } from '../../store/actions';
import { getPreferences } from '../../selectors/selectors';
import { MetaMaskReduxState } from '../../store/store';
import { VALID, verify } from '../../../shared/lib/deep-links/verify';

type TranslateFunction = (
  key: string,
  substitutions?: (string | React.JSX.Element)[],
) => string;

type Route = {
  href: string;
  signed: boolean;
};

const { getExtensionURL } = globalThis.platform;

/**
 * Sets the description and title state for a 404 error.
 *
 * @param setDescription - The function to call to set the description state.
 * @param setTitle - The function to call to set the title state.
 * @param t - The translation function.
 * @param setPageNotFoundError - The function to call to set the error 404 state.
 */
function set404(
  setDescription: React.Dispatch<React.SetStateAction<string | null>>,
  setTitle: React.Dispatch<React.SetStateAction<string | null>>,
  t: TranslateFunction,
  setPageNotFoundError: React.Dispatch<React.SetStateAction<boolean>>,
) {
  setDescription(t('deepLink_Error404Description'));
  setTitle(t('deepLink_Error404Title'));
  setPageNotFoundError(true);
}

/**
 * Updates the state based on the URL path and query. This function parses the
 * URL, retrieves the route, and sets the route and error state accordingly.
 *
 * @param urlPathAndQuery - The URL path and query string to parse. (relative to its origin, i.e., /home?utm_source=foo)
 * @param setDescription - The function to call to set the description state.
 * @param setExtraDescription - The function to call to set the extra description state.
 * @param setIsLoading - The function to call to set the loading state.
 * @param setRoute - The function to call to set the route state.
 * @param setTitle - The function to call to set the title state.
 * @param setCta - The function to call to set the call-to-action state.
 * @param t - The translation function.
 * @param abortController
 * @param setPageNotFoundError - The function to call to set the error 404 state.
 */
async function updateStateFromUrl(
  urlPathAndQuery: string,
  setDescription: React.Dispatch<React.SetStateAction<string | null>>,
  setExtraDescription: React.Dispatch<React.SetStateAction<string | null>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setRoute: React.Dispatch<React.SetStateAction<Route | null>>,
  setTitle: React.Dispatch<React.SetStateAction<string | null>>,
  setCta: React.Dispatch<React.SetStateAction<string | null>>,
  t: TranslateFunction,
  abortController: AbortController,
  setPageNotFoundError: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    const fullUrlStr = `https://${DEEP_LINK_HOST}${urlPathAndQuery}`;
    const url = new URL(fullUrlStr);
    setIsLoading(true);
    const parsed = await parse(url);
    if (abortController.signal.aborted) {
      return;
    }
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
      setExtraDescription(null);
      setRoute({ href, signed });
      setTitle(
        signed ? t('deepLink_RedirectingToMetaMask') : t('deepLink_Caution'),
      );
      setCta(t('deepLink_Continue', [t(title)]));
      setPageNotFoundError(false);
    } else {
      setRoute(null);
      set404(setDescription, setTitle, t, setPageNotFoundError);
      setCta(t('deepLink_GoToTheHomePageButton'));

      const signature = await verify(url);
      if (abortController.signal.aborted) {
        return;
      }
      if (signature === VALID) {
        setExtraDescription(
          t('deepLink_Error404_CTA', [
            <ButtonLink
              key="update-metamask-link"
              as="a"
              href="https://support.metamask.io/configure/wallet/how-to-update-the-version-of-metamask/"
            >
              {t('deepLink_Error404_CTA_LinkText')}
            </ButtonLink>,
          ]),
        );
      }
    }
  } catch (e) {
    log.error('Error parsing deep link:', e);
    setDescription(t('deepLink_ErrorOtherDescription'));
    setExtraDescription(null);
    setRoute(null);
    setTitle(t('deepLink_ErrorOtherTitle'));
    setCta(t('deepLink_GoToTheHomePageButton'));
    setPageNotFoundError(false);
  } finally {
    setIsLoading(false);
  }
}

type DeepLinkProps = {
  location: RouterLocation;
};

export const DeepLink = ({ location }: DeepLinkProps) => {
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
  const [pageNotFoundError, setPageNotFoundError] = useState<boolean>(false);
  const [extraDescription, setExtraDescription] = useState<string | null>(null);
  const [route, setRoute] = useState<null | Route>(null);
  const [title, setTitle] = useState<null | string>(null);
  const [cta, setCta] = useState<null | string>(null);
  const [skipDeepLinkInterstitialChecked, setSkipDeepLinkInterstitialChecked] =
    useState(skipDeepLinkInterstitial);
  const [isLoading, setIsLoading] = useState(true);

  // Use ref to track current abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any previous operation
    abortControllerRef.current?.abort();

    // Create new abort controller for this operation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const processDeepLink = async () => {
      const params = new URLSearchParams(location.search);
      const urlStr = params.get('u');
      const errorCode = params.get('errorCode');

      if (!urlStr || errorCode) {
        setRoute(null);
        setIsLoading(false);
        if (errorCode === '404') {
          set404(setDescription, setTitle, t, setPageNotFoundError);

          if (urlStr) {
            try {
              const fullUrlStr = `https://${DEEP_LINK_HOST}${urlStr}`;
              const url = new URL(fullUrlStr);
              const signature = await verify(url);

              // Check if aborted after async operation
              if (abortController.signal.aborted) {
                return;
              }

              if (signature === VALID) {
                setExtraDescription(
                  t('deepLink_Error404_CTA', [
                    <ButtonLink
                      key="update-metamask-link"
                      as="a"
                      href="https://support.metamask.io/configure/wallet/how-to-update-the-version-of-metamask/"
                    >
                      {t('deepLink_Error404_CTA_LinkText')}
                    </ButtonLink>,
                  ]),
                );
              } else {
                setExtraDescription(null);
              }
            } catch (e) {
              // probably a gibberish url, ignore
              if (abortController.signal.aborted) {
                return;
              }
              setExtraDescription(null);
            }
          } else {
            setExtraDescription(null);
          }
        } else {
          setDescription(null);
          setExtraDescription(null);
          setTitle(t('deepLink_ErrorMissingUrl'));
          setPageNotFoundError(false);
        }
        setCta(t('deepLink_GoToTheHomePageButton'));
        return;
      }

      await updateStateFromUrl(
        urlStr,
        setDescription,
        setExtraDescription,
        setIsLoading,
        setRoute,
        setTitle,
        setCta,
        t,
        abortController,
        setPageNotFoundError,
      );
    };

    processDeepLink();

    // Cleanup function
    return () => abortController.abort();
  }, [location.search, t, setPageNotFoundError]);

  // Cleanup on unmount
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  function onRemindMeStateChanged() {
    const newValue = !skipDeepLinkInterstitialChecked;
    setSkipDeepLinkInterstitialChecked(newValue);
    dispatch(setSkipDeepLinkInterstitial(newValue));
  }

  return (
    <Container
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      style={{ marginTop: '111px' }}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderMuted}
        borderRadius={BorderRadius.MD}
        style={{ width: '446px', minHeight: '592px' }}
        paddingLeft={6}
        paddingRight={6}
        paddingTop={12}
        paddingBottom={8}
        borderWidth={1}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
        >
          {pageNotFoundError ? (
            <img
              className="error-404-image"
              alt="Error 404: Page not found"
              src="./images/deep-link-error-404.png"
            />
          ) : (
            <img
              className="metamask-deep-link-logo"
              alt="MetaMask logo"
              src="./images/logo/metamask-fox.svg"
              style={{ width: '160px', height: '160px' }}
            />
          )}
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
                fontWeight={FontWeight.Bold}
                marginTop={4}
                marginBottom={4}
              >
                {title}
              </Text>
            )}
            {description && (
              <Box
                as="div"
                data-testid="deep-link-description"
                paddingBottom={12}
                height={BlockSize.Full}
              >
                <Text
                  key="description"
                  variant={TextVariant.bodyMd}
                  color={TextColor.textAlternative}
                >
                  {description}
                </Text>
                {extraDescription ? (
                  <Box key="extra-description">{extraDescription}</Box>
                ) : (
                  ''
                )}
              </Box>
            )}

            <Box width={BlockSize.Full} marginTop={12}>
              {route?.signed ? (
                <Box
                  display={Display.Flex}
                  width={BlockSize.Full}
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
      </Box>
    </Container>
  );
};
