import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AvatarNetwork,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  HelpText,
  HelpTextSeverity,
  Label,
  Text,
  TextButton,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import ZENDESK_URLS from '../../helpers/constants/zendesk-url';
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
import { getHexChainId } from './chainlist-network-picker';

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

type AddRpcUrlPageFormProps = {
  onCancel: () => void;
  onAdded: (url: string, name?: string) => void;
  chainId?: string;
  networkName?: string;
  existingRpcUrls?: string[];
};

const hasChainId = (chainId?: string) =>
  Boolean(chainId && /^(\d+|0x[0-9a-f]+)$/iu.test(chainId.trim()));

export const AddRpcUrlPageForm = ({
  onCancel,
  onAdded,
  chainId,
  networkName,
  existingRpcUrls = EMPTY_RPC_URLS,
}: AddRpcUrlPageFormProps) => {
  const t = useI18nContext();
  const { safeChains } = useSafeChains({ enabled: true });
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [rpcValidationError, setRpcValidationError] = useState<string>();
  const [validatedUrl, setValidatedUrl] = useState<string>();
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [urlFeedback, setUrlFeedback] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const validationRequestIdRef = useRef(0);
  const latestUrlRef = useRef(url);
  const debouncedUrl = useDebouncedValue(url);

  const urlErrorKey = getUrlErrorKey(url);
  const urlError = urlErrorKey ? t(urlErrorKey) : undefined;
  const suggestions = useMemo(
    () =>
      getChainlistRpcSuggestions({
        chains: (safeChains ?? []) as ChainlistRpcChain[],
        chainId,
        existingRpcUrls,
        query: url,
      }),
    [chainId, existingRpcUrls, safeChains, url],
  );
  const showSuggestions =
    isUrlFocused && !suggestionsDismissed && suggestions.length > 0;
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
  };

  const handleSuggestionSelect = (suggestion: ChainlistRpcSuggestion) => {
    setUrl(suggestion.url);
    latestUrlRef.current = suggestion.url;
    setName(suggestion.nickname);
    setRpcValidationError(undefined);
    setValidatedUrl(undefined);
    setUrlFeedback(true);
    setSuggestionsDismissed(true);
  };

  const handleLearnHowToStaySafe = () => {
    global.platform.openTab({ url: ZENDESK_URLS.UNKNOWN_NETWORK });
  };

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

    onAdded(trimmedUrl, name.trim() || undefined);
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
          <Box className="flex w-full flex-col">
            <Label htmlFor="rpcUrl" className="mb-1">
              {t('rpcUrl')}
            </Label>
            <TextField
              id="rpcUrl"
              size={TextFieldSize.Lg}
              placeholder={t('enterRpcUrl')}
              value={url}
              onChange={handleUrlChange}
              onFocus={() => {
                setIsUrlFocused(true);
                setSuggestionsDismissed(false);
              }}
              onBlur={() => {
                setIsUrlFocused(false);
                if (url.trim()) {
                  setUrlFeedback(true);
                }
              }}
              isError={Boolean(displayedError)}
              className="w-full"
              inputProps={
                {
                  'data-testid': 'rpc-url-input-test',
                } as React.ComponentPropsWithoutRef<'input'>
              }
            />
            {showSuggestions ? (
              <Box
                className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-border-muted bg-background-default p-3"
                data-testid="add-rpc-chainlist-suggestions"
              >
                <BannerAlert
                  severity={BannerAlertSeverity.Info}
                  data-testid="add-rpc-chainlist-source-banner"
                  description={t('chainlistRpcDataSourceBanner', [
                    <TextButton
                      key="chainlist-rpc-learn-how-to-stay-safe"
                      onClick={handleLearnHowToStaySafe}
                    >
                      {t('chainlistLearnHowToStaySafe')}
                    </TextButton>,
                  ])}
                />
                {suggestions.map((suggestion) => (
                  <button
                    className="flex w-full flex-col px-1 py-3 text-left hover:bg-hover"
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
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        padding={4}
        paddingBottom={6}
        className="shrink-0 flex-row"
      >
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          onClick={onCancel}
          className="flex-1"
          data-testid="page-container-footer-cancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="flex-1"
          data-testid="page-container-footer-next"
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};
