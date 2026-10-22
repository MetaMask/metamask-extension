import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import log from 'loglevel';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  FontWeight,
  Text,
  TextButton,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { parse } from '../../../shared/lib/deep-links/parse';
import { CANONICAL_DEEP_LINK_HOST } from '../../../shared/lib/deep-links/common';
import { useI18nContext } from '../../hooks/useI18nContext';
import { setSkipDeepLinkInterstitial } from '../../store/actions';
import { getPreferences } from '../../../shared/lib/selectors/preferences';
import type { MetaMaskReduxState } from '../../store/types';
import { useDispatch } from '../../store/hooks';
import { VALID, verify } from '../../../shared/lib/deep-links/verify';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import { PageNotFound } from '../../components/app/page-not-found/page-not-found';
import { FullPageCard } from '../../components/app/full-page-card/full-page-card';

type TranslateFunction = (
  key: string,
  substitutions?: (string | JSX.Element)[],
) => string;

type Route = {
  href: string;
  signed: boolean;
};

const { getExtensionURL } = globalThis.platform;

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
 * @param setPageNotFoundError - The function to call when the destination is missing.
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
    const fullUrlStr = `https://${CANONICAL_DEEP_LINK_HOST}${urlPathAndQuery}`;
    const url = new URL(fullUrlStr);
    setIsLoading(true);
    const parsed = await parse(url);
    if (abortController.signal.aborted) {
      return;
    }
    if (parsed) {
      const { destination } = parsed;

      const href =
        'redirectTo' in destination
          ? destination.redirectTo.toString()
          : getExtensionURL(
              destination.path,
              destination.query.toString() ?? null,
            );
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
      setPageNotFoundError(true);

      const signature = await verify(url);
      if (abortController.signal.aborted) {
        return;
      }
      if (signature === VALID) {
        setExtraDescription(
          t('deepLink_Error404_CTA', [
            <TextButton key="update-metamask-link" asChild>
              <a href={ZENDESK_URLS.UPDATE_VERSION}>
                {t('deepLink_Error404_CTA_LinkText')}
              </a>
            </TextButton>,
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
          setPageNotFoundError(true);

          if (urlStr) {
            try {
              const fullUrlStr = `https://${CANONICAL_DEEP_LINK_HOST}${urlStr}`;
              const url = new URL(fullUrlStr);
              const signature = await verify(url);

              // Check if aborted after async operation
              if (abortController.signal.aborted) {
                return;
              }

              if (signature === VALID) {
                setExtraDescription(
                  t('deepLink_Error404_CTA', [
                    <TextButton key="update-metamask-link" asChild>
                      <a href={ZENDESK_URLS.UPDATE_VERSION}>
                        {t('deepLink_Error404_CTA_LinkText')}
                      </a>
                    </TextButton>,
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

  if (pageNotFoundError && !isLoading) {
    return (
      <PageNotFound
        extraDescription={extraDescription}
        pageTestId="parent-selector-deep-link-page"
      />
    );
  }

  return (
    <FullPageCard pageTestId="parent-selector-deep-link-page">
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
      >
        <img
          className="metamask-deep-link-logo h-40 w-40"
          alt="MetaMask logo"
          src="./images/logo/metamask-fox.svg"
        />
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
              asChild
              variant={TextVariant.HeadingLg}
              fontWeight={FontWeight.Bold}
              className="my-4"
            >
              <h1>{title}</h1>
            </Text>
          )}
          {description && (
            <Box
              paddingBottom={12}
              className="w-full"
              data-testid="deep-link-description"
            >
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {description}
              </Text>
              {extraDescription ? <Box>{extraDescription}</Box> : null}
            </Box>
          )}

          <Box marginTop={12} className="w-full">
            {route?.signed ? (
              <Box
                padding={3}
                marginBottom={6}
                backgroundColor={BoxBackgroundColor.BackgroundMuted}
                className="w-full rounded-xl text-left"
              >
                <Checkbox
                  id="dont-remind-me-checkbox"
                  data-testid="deep-link-checkbox"
                  isSelected={skipDeepLinkInterstitialChecked}
                  onChange={onRemindMeStateChanged}
                  label={t('deepLink_DontRemindMeAgain')}
                  labelProps={{
                    variant: TextVariant.BodySm,
                    fontWeight: FontWeight.Regular,
                  }}
                />
              </Box>
            ) : null}
            <Button
              asChild
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full hover:text-primary-inverse"
            >
              <a
                href={route?.href ?? getExtensionURL('/')}
                data-testid="deep-link-continue-button"
              >
                {cta}
              </a>
            </Button>
          </Box>
        </>
      )}
    </FullPageCard>
  );
};
