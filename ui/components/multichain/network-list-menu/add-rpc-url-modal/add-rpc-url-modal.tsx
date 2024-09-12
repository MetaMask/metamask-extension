import React, { useEffect, useRef, useState } from 'react';
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
import { isWebUrl } from '../../../../../app/scripts/lib/util';

const AddRpcUrlModal = ({
  onAdded,
}: {
  onAdded: (url: string, name?: string) => void;
}) => {
  const t = useI18nContext();

  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (url && !isWebUrl(url)) {
      setError(isWebUrl(`https://${url}`) ? t('urlErrorMsg') : t('invalidRPC'));
    } else {
      setError(undefined);
    }
  }, [url]);

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
          onChange={(e) => setUrl(e.target.value)}
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
          disabled={Boolean(error)}
          size={ButtonPrimarySize.Lg}
          onClick={async () => {
            if (url && !error && nameRef.current) {
              onAdded(url, nameRef.current.value || undefined);
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
