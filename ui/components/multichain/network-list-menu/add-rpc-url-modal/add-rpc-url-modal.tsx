import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  FormTextField,
  FormTextFieldSize,
  HelpText,
  HelpTextSeverity,
} from '../../../component-library';
import {
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isWebUrl } from '../../../../../shared/lib/url-utils';
import { validateRpcUrlChainId } from './validate-rpc-url';

const AddRpcUrlModal = ({
  onAdded,
  expectedChainId,
}: {
  onAdded: (url: string, name?: string) => void;
  expectedChainId?: string;
}) => {
  const t = useI18nContext();

  const [url, setUrl] = useState<string>();
  const [rpcError, setRpcError] = useState<string>();
  const [isValidatingRpc, setIsValidatingRpc] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const trimmedUrl = url?.trim();
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
    if (trimmedUrl && !isWebUrl(trimmedUrl)) {
      return isWebUrl(`https://${trimmedUrl}`)
        ? t('urlErrorMsg')
        : t('invalidRPC');
    }

    return undefined;
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
      className="add-rpc-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
    >
      <Box paddingTop={4} paddingLeft={4} paddingRight={4}>
        <FormTextField
          id="rpcUrl"
          size={FormTextFieldSize.Lg}
          error={Boolean(error)}
          label={t('rpcUrl')}
          placeholder={t('enterRpcUrl')}
          textFieldProps={{ borderRadius: BorderRadius.LG }}
          labelProps={{
            children: undefined,
            variant: TextVariant.bodyMdMedium,
          }}
          inputProps={{
            'data-testid': 'rpc-url-input-test',
          }}
          onChange={handleUrlChange}
          autoFocus
        />
        {error && (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        )}
        <FormTextField
          id="rpcName"
          size={FormTextFieldSize.Lg}
          inputProps={{
            'data-testid': 'rpc-name-input-test',
          }}
          placeholder={t('enterANameToIdentifyTheUrl')}
          paddingTop={4}
          inputRef={nameRef}
          label={t('rpcNameOptional')}
          textFieldProps={{ borderRadius: BorderRadius.LG }}
          labelProps={{
            children: undefined,
            variant: TextVariant.bodyMdMedium,
          }}
        />
      </Box>

      <Box
        className="add-rpc-modal__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        width={BlockSize.Full}
      >
        <ButtonPrimary
          width={BlockSize.Full}
          disabled={isSubmitDisabled}
          size={ButtonPrimarySize.Lg}
          data-testid="page-container-footer-next"
          onClick={async () => {
            if (trimmedUrl && !error && nameRef.current) {
              onAdded(trimmedUrl, nameRef.current.value || undefined);
            }
          }}
        >
          {t('addUrl')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

export default AddRpcUrlModal;
