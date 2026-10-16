import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AvatarNetwork,
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
  TextAlign,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { isWebUrl } from '../../../shared/lib/url-utils';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  infuraProjectId,
} from '../../../shared/constants/network';
import {
  isRpcRateLimitError,
  jsonRpcRequest,
} from '../../../shared/lib/rpc.utils';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSafeChains } from '../../components/multichain/networks-form/use-safe-chains';
import {
  getChainlistRpcSuggestions,
  type ChainlistRpcChain,
  type ChainlistRpcSuggestion,
} from './chainlist-rpc';
import {
  ChainlistSourceBanner,
  getHexChainId,
} from './chainlist-network-picker';

const templateInfuraRpc = (endpoint: string) => {
  const rpcUrl = endpoint.endsWith('{infuraProjectId}')
    ? endpoint.replace('{infuraProjectId}', infuraProjectId ?? '')
    : endpoint;

  return new URL(rpcUrl).toString();
};

const getUrlErrorKey = (
  nextUrl: string,
): 'urlErrorMsg' | 'invalidRPC' | undefined => {
  if (!nextUrl) {
    return undefined;
  }

  if (isWebUrl(nextUrl)) {
    return undefined;
  }

  return isWebUrl(`https://${nextUrl}`) ? 'urlErrorMsg' : 'invalidRPC';
};

const EMPTY_RPC_URLS: string[] = [];

export type RpcUrlSource = 'chainlist' | 'manual';

type AddRpcUrlPageFormProps = {
  onAdded: (
    url: string,
    name: string | undefined,
    source: RpcUrlSource,
  ) => void;
  chainId?: string;
  networkName?: string;
  existingRpcUrls?: string[];
  /**
   * Suggest Chainlist RPCs for the form's chain. Controlled by
   * `extension-ux-chainlist-v-2`.
   */
  chainlistEnabled?: boolean;
};

const hasChainId = (chainId?: string) =>
  Boolean(chainId && /^(\d+|0x[0-9a-f]+)$/iu.test(chainId.trim()));

export const AddRpcUrlPageForm = ({
  onAdded,
  chainId,
  networkName,
  existingRpcUrls = EMPTY_RPC_URLS,
  chainlistEnabled = false,
}: AddRpcUrlPageFormProps) => {
  const t = useI18nContext();
  const { safeChains } = useSafeChains({ enabled: chainlistEnabled });
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [rpcValidationError, setRpcValidationError] = useState<string>();
  const [validatedUrl, setValidatedUrl] = useState<string>();
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [urlFeedback, setUrlFeedback] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [source, setSource] = useState<RpcUrlSource>('manual');
  const validationRequestIdRef = useRef(0);
  const latestUrlRef = useRef(url);
  const rpcUrlSectionRef = useRef<HTMLDivElement>(null);
  const debouncedUrl = useDebouncedValue(url);

  const urlErrorKey = getUrlErrorKey(url);
  const urlError = urlErrorKey ? t(urlErrorKey) : undefined;
  const suggestions = useMemo(() => {
    if (!chainlistEnabled) {
      return [];
    }

    return getChainlistRpcSuggestions({
      chains: (safeChains ?? []) as ChainlistRpcChain[],
      chainId,
      existingRpcUrls,
      query: url,
    });
  }, [chainId, chainlistEnabled, existingRpcUrls, safeChains, url]);
  const trimmedQuery = url.trim();
  const showSuggestions = !suggestionsDismissed && suggestions.length > 0;
  const showNoMatches =
    chainlistEnabled &&
    !suggestionsDismissed &&
    isWebUrl(trimmedQuery) &&
    suggestions.length === 0;
  const networkImageUrl =
    hasChainId(chainId) && chainId
      ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          getHexChainId(
            chainId,
          ) as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ]
      : undefined;

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUrl = event.target.value;
    setUrl(nextUrl);
    latestUrlRef.current = nextUrl;
    setRpcValidationError(undefined);
    setValidatedUrl(undefined);
    setSuggestionsDismissed(false);
    setSource('manual');
  };

  const handleSuggestionSelect = (suggestion: ChainlistRpcSuggestion) => {
    setUrl(suggestion.url);
    latestUrlRef.current = suggestion.url;
    setName(suggestion.nickname);
    setRpcValidationError(undefined);
    setValidatedUrl(undefined);
    setUrlFeedback(true);
    setSuggestionsDismissed(true);
    setSource('chainlist');
  };

  const handleUseTypedUrl = () => {
    setSuggestionsDismissed(true);
    if (trimmedQuery) {
      setUrlFeedback(true);
    }
  };

  useEffect(() => {
    if (suggestionsDismissed || !chainlistEnabled) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const { target } = event;
      if (!(target instanceof Node)) {
        return;
      }
      if (rpcUrlSectionRef.current?.contains(target)) {
        return;
      }
      setSuggestionsDismissed(true);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [chainlistEnabled, suggestionsDismissed]);

  useEffect(() => {
    const trimmedUrl = debouncedUrl.trim();
    const debouncedUrlErrorKey = getUrlErrorKey(debouncedUrl);

    if (!trimmedUrl || debouncedUrlErrorKey) {
      return;
    }

    validationRequestIdRef.current += 1;
    const requestId = validationRequestIdRef.current;
    const isCurrentValidation = () =>
      validationRequestIdRef.current === requestId &&
      latestUrlRef.current.trim() === trimmedUrl;

    jsonRpcRequest(templateInfuraRpc(trimmedUrl), 'eth_chainId')
      .then(() => {
        if (isCurrentValidation()) {
          setRpcValidationError(undefined);
          setValidatedUrl(trimmedUrl);
        }
      })
      .catch((error) => {
        if (isCurrentValidation()) {
          setRpcValidationError(
            isRpcRateLimitError(error)
              ? t('rpcUrlRateLimited')
              : t('failedToFetchChainId'),
          );
          setValidatedUrl(undefined);
        }
      });

    return () => {
      validationRequestIdRef.current += 1;
    };
  }, [debouncedUrl, t]);

  const trimmedUrl = url.trim();
  const error = urlError ?? rpcValidationError;
  const showUrlError = Boolean(trimmedUrl) && (urlFeedback || submitted);
  let displayedError: string | undefined;
  if (!trimmedUrl && submitted) {
    displayedError = t('fieldRequired', [t('rpcUrl')]);
  } else if (trimmedUrl && showUrlError) {
    displayedError = error;
  }
  const isSubmitDisabled =
    Boolean(trimmedUrl) && (validatedUrl !== trimmedUrl || Boolean(error));
  const handleSubmit = () => {
    setSubmitted(true);
    setUrlFeedback(true);
    if (!trimmedUrl || validatedUrl !== trimmedUrl || Boolean(error)) {
      return;
    }

    onAdded(trimmedUrl, name.trim() || undefined, source);
  };

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex h-full w-full min-h-0 flex-col"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="flex min-h-0 flex-1 flex-col overflow-auto"
        style={{ scrollbarColor: 'var(--color-icon-muted) transparent' }}
      >
        <Box className="flex w-full flex-col gap-6 px-4 pt-4">
          {networkName ? (
            <Box className="flex items-center gap-3">
              {networkImageUrl ? (
                <AvatarNetwork
                  className="shrink-0 rounded-lg"
                  name={networkName}
                  size="md"
                  src={networkImageUrl}
                />
              ) : (
                <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium text-text-default">
                  {networkName.charAt(0).toUpperCase()}
                </Box>
              )}
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                data-testid="add-rpc-network-name"
              >
                {networkName}
              </Text>
            </Box>
          ) : null}
          <Box
            ref={rpcUrlSectionRef}
            className="flex w-full flex-col"
            onBlur={(event) => {
              if (
                event.currentTarget.contains(event.relatedTarget as Node | null)
              ) {
                return;
              }

              if (url.trim()) {
                setUrlFeedback(true);
              }
            }}
          >
            <Label htmlFor="rpcUrl" className="mb-1">
              {t('rpcUrl')}
            </Label>
            <TextField
              id="rpcUrl"
              autoFocus
              size={TextFieldSize.Lg}
              placeholder={t('enterRpcUrl')}
              value={url}
              onChange={handleUrlChange}
              onFocus={() => {
                setSuggestionsDismissed(false);
              }}
              isError={Boolean(displayedError)}
              className="w-full"
              inputProps={
                {
                  'data-testid': 'rpc-url-input-test',
                } as React.ComponentPropsWithoutRef<'input'>
              }
            />
            {showNoMatches ? (
              <Box
                className="mt-2 overflow-hidden rounded-xl border border-border-muted bg-background-default"
                data-testid="add-rpc-chainlist-no-matches"
                onMouseDown={(event) => event.preventDefault()}
              >
                <Text
                  variant={TextVariant.BodyMd}
                  textAlign={TextAlign.Left}
                  className="block w-full px-4 py-4 text-text-alternative"
                >
                  {t('chainlistNoMatches')}
                </Text>
                <button
                  className="flex w-full flex-col border-t border-border-muted px-4 py-3 text-left hover:bg-hover"
                  data-testid="add-rpc-chainlist-use-typed-url"
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={handleUseTypedUrl}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    color={TextColor.InfoDefault}
                  >
                    {t('chainlistUseTypedRpcUrl', [trimmedQuery])}
                  </Text>
                  <Text
                    variant={TextVariant.BodySm}
                    className="text-text-alternative"
                  >
                    {t('chainlistEnterRpcUrlManually')}
                  </Text>
                </button>
              </Box>
            ) : null}
            {showSuggestions ? (
              <Box
                className="mt-2 max-h-[calc(100dvh-14rem)] overflow-y-auto rounded-xl border border-border-muted bg-background-default"
                data-testid="add-rpc-chainlist-suggestions"
                onMouseDown={(event) => event.preventDefault()}
              >
                <Box className="px-3 pt-3 pb-2">
                  <ChainlistSourceBanner
                    description={(learnMore) =>
                      t('chainlistRpcDataSourceBanner', [learnMore])
                    }
                    onLearnMoreMouseDown={(event) => event.preventDefault()}
                    testId="add-rpc-chainlist-source-banner"
                  />
                </Box>
                {suggestions.map((suggestion) => (
                  <button
                    className="flex w-full flex-col px-4 py-3 text-left hover:bg-hover"
                    data-testid="add-rpc-chainlist-suggestion"
                    key={suggestion.url}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                    >
                      {suggestion.nickname}
                    </Text>
                    <Text
                      variant={TextVariant.BodyMd}
                      className="truncate text-text-alternative"
                    >
                      {suggestion.url}
                    </Text>
                  </button>
                ))}
              </Box>
            ) : null}
            {displayedError ? (
              <HelpText severity={HelpTextSeverity.Danger}>
                {displayedError}
              </HelpText>
            ) : null}
          </Box>
          <Box className="flex w-full flex-col">
            <Label htmlFor="rpcName" className="mb-1">
              {t('rpcNameOptional')}
            </Label>
            <TextField
              id="rpcName"
              size={TextFieldSize.Lg}
              placeholder={t('enterANameToIdentifyTheUrl')}
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              className="w-full"
              inputProps={
                {
                  'data-testid': 'rpc-name-input-test',
                } as React.ComponentPropsWithoutRef<'input'>
              }
            />
          </Box>
        </Box>
      </Box>

      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        className="networks-form__footer networks-form__footer--page w-full shrink-0"
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSubmitDisabled}
          onClick={handleSubmit}
          isFullWidth
          data-testid="page-container-footer-next"
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};
