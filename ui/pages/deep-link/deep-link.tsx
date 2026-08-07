import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import log from 'loglevel';
import { useSelector } from 'react-redux';
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
import { getPreferences } from '../../../shared/lib/selectors/preferences';
import type { MetaMaskReduxState } from '../../store/types';
import { useDispatch } from '../../store/hooks';
import { VALID, verify } from '../../../shared/lib/deep-links/verify';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
import MetaMaskFoxLogo from '../../../app/images/logo/metamask-fox.svg';
import SpinnerGif from '../../../app/images/spinner.gif';

type TranslateFunction = (
  key: string,
  substitutions?: (string | JSX.Element)[],
) => string;

type Route = {
  href: string;
  signed: boolean;
};

type ResolvedDeepLinkState = {
  description: string | null;
  extraDescription: string | null;
  route: Route | null;
  title: string | null;
  cta: string | null;
  pageNotFoundError: boolean;
};

type DeepLinkViewState =
  | { kind: 'loading' }
  | ({ kind: 'ready' } & ResolvedDeepLinkState);

type PreParsedDeepLinkResult =
  | {
      kind: 'route';
      href: string;
      title: string;
      signed: boolean;
    }
  | {
      kind: 'not-found';
      signed: boolean;
    }
  | {
      kind: 'error';
    };

type PreParseTask = {
  urlPathAndQuery: string;
  abortController: AbortController;
  promise: Promise<PreParsedDeepLinkResult | null>;
};

const LOADING_VIEW_STATE: DeepLinkViewState = { kind: 'loading' };

const getExtensionURL = (path: string, query?: string | null) =>
  globalThis.platform.getExtensionURL(path, query);

const toReadyViewState = (
  resolvedState: ResolvedDeepLinkState,
): DeepLinkViewState => ({
  kind: 'ready',
  ...resolvedState,
});

function build404State(
  t: TranslateFunction,
  signed: boolean,
): ResolvedDeepLinkState {
  return {
    description: t('deepLink_Error404Description'),
    extraDescription: signed
      ? t('deepLink_Error404_CTA', [
          <ButtonLink
            key="update-metamask-link"
            as="a"
            href={ZENDESK_URLS.UPDATE_VERSION}
          >
            {t('deepLink_Error404_CTA_LinkText')}
          </ButtonLink>,
        ])
      : null,
    route: null,
    title: t('deepLink_Error404Title'),
    cta: t('deepLink_GoToTheHomePageButton'),
    pageNotFoundError: true,
  };
}

function buildMissingUrlState(t: TranslateFunction): ResolvedDeepLinkState {
  return {
    description: null,
    extraDescription: null,
    route: null,
    title: t('deepLink_ErrorMissingUrl'),
    cta: t('deepLink_GoToTheHomePageButton'),
    pageNotFoundError: false,
  };
}

function buildGenericErrorState(t: TranslateFunction): ResolvedDeepLinkState {
  return {
    description: t('deepLink_ErrorOtherDescription'),
    extraDescription: null,
    route: null,
    title: t('deepLink_ErrorOtherTitle'),
    cta: t('deepLink_GoToTheHomePageButton'),
    pageNotFoundError: false,
  };
}

function buildResolvedState(
  result: PreParsedDeepLinkResult,
  t: TranslateFunction,
): ResolvedDeepLinkState {
  if (result.kind === 'error') {
    return buildGenericErrorState(t);
  }

  if (result.kind === 'not-found') {
    return build404State(t, result.signed);
  }

  const translatedDestinationTitle = t(result.title);
  const continueMessage = t('deepLink_ContinueDescription', [
    translatedDestinationTitle,
  ]);

  return {
    description: result.signed
      ? continueMessage
      : t('deepLink_ThirdPartyDescription', [continueMessage]),
    extraDescription: null,
    route: {
      href: result.href,
      signed: result.signed,
    },
    title: result.signed
      ? t('deepLink_RedirectingToMetaMask')
      : t('deepLink_Caution'),
    cta: t('deepLink_Continue', [translatedDestinationTitle]),
    pageNotFoundError: false,
  };
}

async function preParseDeepLink(
  urlPathAndQuery: string,
  signal: AbortSignal,
): Promise<PreParsedDeepLinkResult | null> {
  try {
    const url = new URL(`https://${DEEP_LINK_HOST}${urlPathAndQuery}`);
    const parsed = await parse(url);

    if (signal.aborted) {
      return null;
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

      return {
        kind: 'route',
        href,
        title: parsed.route.getTitle(url.searchParams),
        signed: parsed.signature === VALID,
      };
    }

    const signature = await verify(url);

    if (signal.aborted) {
      return null;
    }

    return {
      kind: 'not-found',
      signed: signature === VALID,
    };
  } catch (error) {
    if (signal.aborted) {
      return null;
    }

    log.error('Error parsing deep link:', error);
    return { kind: 'error' };
  }
}

function ensurePreParseTask(
  taskRef: React.MutableRefObject<PreParseTask | null>,
  urlPathAndQuery: string,
): PreParseTask {
  const currentTask = taskRef.current;

  if (
    currentTask?.urlPathAndQuery === urlPathAndQuery &&
    !currentTask.abortController.signal.aborted
  ) {
    return currentTask;
  }

  currentTask?.abortController.abort();

  const abortController = new AbortController();
  const task: PreParseTask = {
    urlPathAndQuery,
    abortController,
    promise: preParseDeepLink(urlPathAndQuery, abortController.signal),
  };

  taskRef.current = task;
  return task;
}

function getMatchingPreParseTask(
  taskRef: React.MutableRefObject<PreParseTask | null>,
  urlPathAndQuery: string,
): PreParseTask | null {
  const task = taskRef.current;

  if (
    task?.urlPathAndQuery === urlPathAndQuery &&
    !task.abortController.signal.aborted
  ) {
    return task;
  }

  return null;
}

function getSignedFromPreParsedResult(
  result: PreParsedDeepLinkResult,
): boolean | undefined {
  return result.kind === 'error' ? undefined : result.signed;
}

async function verifyDeepLinkSignature(
  urlPathAndQuery: string,
): Promise<boolean> {
  try {
    const url = new URL(`https://${DEEP_LINK_HOST}${urlPathAndQuery}`);
    return (await verify(url)) === VALID;
  } catch {
    // A malformed URL should still render the background-provided 404 state.
    return false;
  }
}

export const DeepLink = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const t = useI18nContext() as TranslateFunction;
  const dispatch = useDispatch();
  const requestId = new URLSearchParams(location.search).get('id');

  // It's technically not possible for a natural flow to reach this page when
  // `skipDeepLinkInterstitial` is true, but if a user manually navigates to
  // this "interstitial" page, or uses their back button, we should show their
  // previously selected preference.
  const skipDeepLinkInterstitial = useSelector(
    (state: MetaMaskReduxState) =>
      getPreferences(state).skipDeepLinkInterstitial,
  );
  const isPendingDeepLinkRequest = useSelector(
    (state: MetaMaskReduxState) =>
      requestId && state.appState.pendingDeepLinkRequestIds.includes(requestId),
  );

  const [viewState, setViewState] =
    useState<DeepLinkViewState>(LOADING_VIEW_STATE);
  const [skipDeepLinkInterstitialChecked, setSkipDeepLinkInterstitialChecked] =
    useState(skipDeepLinkInterstitial);
  const preParseTaskRef = useRef<PreParseTask | null>(null);

  useEffect(() => {
    if (!requestId || isPendingDeepLinkRequest) {
      return;
    }

    const params = new URLSearchParams(location.search);
    params.delete('id');

    navigate(
      {
        pathname: location.pathname,
        search: params.size > 0 ? `?${params.toString()}` : '',
        hash: location.hash,
      },
      { replace: true },
    );
  }, [
    isPendingDeepLinkRequest,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    requestId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const processDeepLink = async () => {
      const params = new URLSearchParams(location.search);
      const urlPathAndQuery = params.get('u');
      const errorCode = params.get('errorCode');

      if (isPendingDeepLinkRequest) {
        if (urlPathAndQuery) {
          // Creating the task starts parsing immediately. The same promise is
          // reused after the background changes the mode. Intentionally not
          // awaited to allow the page to render immediately.
          ensurePreParseTask(preParseTaskRef, urlPathAndQuery).promise;
        }

        // Loading mode is background-authoritative: this page only shows the
        // spinner until the background decides the final destination.
        setViewState(LOADING_VIEW_STATE);
        return;
      }

      if (!urlPathAndQuery) {
        setViewState(
          toReadyViewState(
            errorCode === '404'
              ? build404State(t, false)
              : buildMissingUrlState(t),
          ),
        );
        return;
      }

      if (errorCode) {
        if (errorCode !== '404') {
          setViewState(toReadyViewState(buildMissingUrlState(t)));
          return;
        }

        // Match the existing behavior by showing the 404 immediately, then
        // adding the update link after signature verification completes.
        setViewState(toReadyViewState(build404State(t, false)));

        const existingTask = getMatchingPreParseTask(
          preParseTaskRef,
          urlPathAndQuery,
        );

        let signed: boolean | undefined;

        if (existingTask) {
          const result = await existingTask.promise;

          if (
            cancelled ||
            preParseTaskRef.current !== existingTask ||
            !result
          ) {
            return;
          }

          signed = getSignedFromPreParsedResult(result);
        }

        // A direct 404 does not need to run the full parser. This is also a
        // fallback for the uncommon case where the preparse itself failed.
        signed ??= await verifyDeepLinkSignature(urlPathAndQuery);

        if (cancelled) {
          return;
        }

        if (signed) {
          setViewState(toReadyViewState(build404State(t, true)));
        }
        return;
      }

      const task = ensurePreParseTask(preParseTaskRef, urlPathAndQuery);
      const result = await task.promise;

      if (cancelled || preParseTaskRef.current !== task || !result) {
        return;
      }

      setViewState(toReadyViewState(buildResolvedState(result, t)));
    };

    // intentionally not awaited to allow the page to render immediately
    processDeepLink();

    return () => {
      cancelled = true;
    };
  }, [isPendingDeepLinkRequest, location.search, t]);

  useEffect(
    () => () => {
      preParseTaskRef.current?.abortController.abort();
      preParseTaskRef.current = null;
    },
    [],
  );

  function onRemindMeStateChanged() {
    const newValue = !skipDeepLinkInterstitialChecked;
    setSkipDeepLinkInterstitialChecked(newValue);
    dispatch(setSkipDeepLinkInterstitial(newValue));
  }

  const isLoading = viewState.kind === 'loading';
  const pageNotFoundError =
    viewState.kind === 'ready' && viewState.pageNotFoundError;

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
              src={MetaMaskFoxLogo}
              style={{ width: '160px', height: '160px' }}
            />
          )}
          {isLoading && (
            <img
              data-testid="loading-indicator"
              className="loading-spinner"
              src={SpinnerGif}
              alt=""
            />
          )}
        </Box>
        {viewState.kind === 'ready' && (
          <>
            {viewState.title && (
              <Text
                as="h1"
                variant={TextVariant.headingLg}
                fontWeight={FontWeight.Bold}
                marginTop={4}
                marginBottom={4}
              >
                {viewState.title}
              </Text>
            )}
            {viewState.description && (
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
                  {viewState.description}
                </Text>
                {viewState.extraDescription ? (
                  <Box key="extra-description">
                    {viewState.extraDescription}
                  </Box>
                ) : (
                  ''
                )}
              </Box>
            )}

            <Box width={BlockSize.Full} marginTop={12}>
              {viewState.route?.signed ? (
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
                href={viewState.route?.href ?? getExtensionURL('/')}
                size={ButtonSize.Lg}
                data-testid="deep-link-continue-button"
              >
                {viewState.cta}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};
