import React, { useEffect, useMemo, useState } from 'react';
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
import { validateRpcUrlChainId } from '../../components/multichain/network-list-menu/add-rpc-url-modal/validate-rpc-url';

type AddRpcUrlPageFormProps = {
  onCancel: () => void;
  onAdded: (url: string, name?: string) => void;
  expectedChainId?: string;
};

export const AddRpcUrlPageForm = ({
  onCancel,
  onAdded,
  expectedChainId,
}: AddRpcUrlPageFormProps) => {
  const t = useI18nContext();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [rpcError, setRpcError] = useState<string>();
  const [isValidatingRpc, setIsValidatingRpc] = useState(false);
  const trimmedUrl = url.trim();
  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextUrl = event.target.value;
    const nextTrimmedUrl = nextUrl.trim();

    setUrl(nextUrl);
    setRpcError(undefined);
    setIsValidatingRpc(
      Boolean(nextTrimmedUrl && isWebUrl(nextTrimmedUrl) && expectedChainId),
    );
  };

  const urlError = useMemo(() => {
    if (!trimmedUrl) {
      return undefined;
    }

    if (isWebUrl(trimmedUrl)) {
      return undefined;
    }

    if (isWebUrl(`https://${trimmedUrl}`)) {
      return t('urlErrorMsg');
    }

    return t('invalidRPC');
  }, [t, trimmedUrl]);

  useEffect(() => {
    if (!trimmedUrl || urlError || !expectedChainId) {
      return undefined;
    }

    let isCurrentValidation = true;

    validateRpcUrlChainId({ url: trimmedUrl, expectedChainId, t })
      .then((validationError) => {
        if (isCurrentValidation) {
          setRpcError(validationError);
        }
      })
      .finally(() => {
        if (isCurrentValidation) {
          setIsValidatingRpc(false);
        }
      });

    return () => {
      isCurrentValidation = false;
    };
  }, [expectedChainId, t, trimmedUrl, urlError]);

  const error = urlError ?? rpcError;
  const isSubmitDisabled = !trimmedUrl || Boolean(error) || isValidatingRpc;

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
          onClick={() => onAdded(trimmedUrl, name || undefined)}
          className="flex-1 rounded-xl"
          data-testid="page-container-footer-next"
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};
