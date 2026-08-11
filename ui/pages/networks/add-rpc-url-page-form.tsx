import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  Input,
  Text,
  TextColor,
  TextVariant,
  FontWeight,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import { BorderRadius } from '../../helpers/constants/design-system';
import { isWebUrl } from '../../../shared/lib/url-utils';
import { infuraProjectId } from '../../../shared/constants/network';
import { jsonRpcRequest } from '../../../shared/lib/rpc.utils';

const templateInfuraRpc = (endpoint: string) => {
  const rpcUrl = endpoint.endsWith('{infuraProjectId}')
    ? endpoint.replace('{infuraProjectId}', infuraProjectId ?? '')
    : endpoint;

  return new URL(rpcUrl).toString();
};

const RPC_VALIDATION_DEBOUNCE_MS = 300;

type AddRpcUrlPageFormProps = {
  onCancel: () => void;
  onAdded: (url: string, name?: string) => void;
};

export const AddRpcUrlPageForm = ({
  onCancel,
  onAdded,
}: AddRpcUrlPageFormProps) => {
  const t = useI18nContext();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [rpcValidationError, setRpcValidationError] = useState<string>();
  const [isValidatingRpcUrl, setIsValidatingRpcUrl] = useState(false);
  const validationRequestIdRef = useRef(0);
  const validationTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const getUrlError = (nextUrl: string) => {
    if (!nextUrl) {
      return undefined;
    }

    if (isWebUrl(nextUrl)) {
      return undefined;
    }

    return isWebUrl(`https://${nextUrl}`) ? t('urlErrorMsg') : t('invalidRPC');
  };

  const urlError = getUrlError(url);

  useEffect(() => {
    return () => {
      validationRequestIdRef.current += 1;
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUrl = event.target.value;
    setUrl(nextUrl);
    validationRequestIdRef.current += 1;
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    setRpcValidationError(undefined);

    const trimmedUrl = nextUrl.trim();
    const nextUrlError = getUrlError(nextUrl);
    if (!trimmedUrl || nextUrlError) {
      setIsValidatingRpcUrl(false);
      return;
    }

    setIsValidatingRpcUrl(true);
    const requestId = validationRequestIdRef.current;
    validationTimeoutRef.current = setTimeout(() => {
      jsonRpcRequest(templateInfuraRpc(trimmedUrl), 'eth_chainId')
        .then(() => {
          if (validationRequestIdRef.current === requestId) {
            setRpcValidationError(undefined);
          }
        })
        .catch(() => {
          if (validationRequestIdRef.current === requestId) {
            setRpcValidationError(t('failedToFetchChainId'));
          }
        })
        .finally(() => {
          if (validationRequestIdRef.current === requestId) {
            setIsValidatingRpcUrl(false);
          }
        });
    }, RPC_VALIDATION_DEBOUNCE_MS);
  };

  const error = urlError ?? rpcValidationError;
  const isSubmitDisabled = !url.trim() || Boolean(error) || isValidatingRpcUrl;
  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return;
    }

    onAdded(url.trim(), name || undefined);
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
          <Box className="flex w-full flex-col gap-1">
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {t('rpcUrl')}
            </Text>
            <Input
              id="rpcUrl"
              placeholder={t('enterRpcUrl')}
              value={url}
              onChange={handleUrlChange}
              className="rounded-xl border border-border-muted bg-background-muted px-4 py-3"
              style={{ borderRadius: BorderRadius.XL }}
              data-testid="rpc-url-input-test"
              autoFocus
            />
            {error ? (
              <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
                {error}
              </Text>
            ) : null}
          </Box>
          <Box className="flex w-full flex-col gap-1">
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
            >
              {t('rpcNameOptional')}
            </Text>
            <Input
              id="rpcName"
              placeholder={t('enterANameToIdentifyTheUrl')}
              value={name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setName(event.target.value)
              }
              className="rounded-xl border border-border-muted bg-background-muted px-4 py-3"
              style={{ borderRadius: BorderRadius.XL }}
              data-testid="rpc-name-input-test"
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
          className="flex-1 rounded-xl"
          data-testid="page-container-footer-cancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          isDisabled={isSubmitDisabled}
          onClick={handleSubmit}
          className="flex-1 rounded-xl"
          data-testid="page-container-footer-next"
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};
