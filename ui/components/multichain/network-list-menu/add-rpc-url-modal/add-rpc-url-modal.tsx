import React, { useEffect, useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  TextFieldSize,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { Box, HelpText, HelpTextSeverity } from '../../../component-library';
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

const AddRpcUrlModal = ({
  onAdded,
}: {
  onAdded: (url: string, name?: string) => void;
}) => {
  const t = useI18nContext();

  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [name, setName] = useState('');

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
          size={TextFieldSize.Lg}
          isError={Boolean(error)}
          label={t('rpcUrl')}
          placeholder={t('enterRpcUrl')}
          value={url ?? ''}
          textFieldProps={{ className: 'rounded-lg' }}
          labelProps={{
            variant: DsTextVariant.BodyMd,
          }}
          inputProps={
            {
              'data-testid': 'rpc-url-input-test',
            } as React.InputHTMLAttributes<HTMLInputElement>
          }
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
        {error && (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        )}
        <FormTextField
          id="rpcName"
          size={TextFieldSize.Lg}
          inputProps={
            {
              'data-testid': 'rpc-name-input-test',
            } as React.InputHTMLAttributes<HTMLInputElement>
          }
          placeholder={t('enterANameToIdentifyTheUrl')}
          className="pt-4"
          label={t('rpcNameOptional')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          textFieldProps={{ className: 'rounded-lg' }}
          labelProps={{
            variant: DsTextVariant.BodyMd,
          }}
        />
      </Box>

      <Box
        className="add-rpc-modal__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        width={BlockSize.Full}
      >
        <Button
          isFullWidth
          isDisabled={Boolean(error)}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          data-testid="add-rpc-url-button"
          onClick={async () => {
            if (url && !error) {
              onAdded(url, name || undefined);
            }
          }}
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};

export default AddRpcUrlModal;
