import React, { useEffect, useState } from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  FormTextField,
  TextFieldSize,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import {
  Box,
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

const AddBlockExplorerModal = ({
  onAdded,
}: {
  onAdded: (url: string) => void;
}) => {
  const t = useI18nContext();
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (url && url?.length > 0 && !isWebUrl(url)) {
      setError(t('urlErrorMsg'));
    } else {
      setError(undefined);
    }
  }, [url]);

  return (
    <Box
      className="add-block-explorer-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
    >
      <Box paddingLeft={4} paddingRight={4}>
        <FormTextField
          size={TextFieldSize.Lg}
          textFieldProps={{ className: 'rounded-lg' }}
          isError={Boolean(error)}
          id="additional-rpc-url"
          label={t('blockExplorerUrl')}
          value={url ?? ''}
          inputProps={
            { 'data-testid': 'explorer-url-input' } as React.InputHTMLAttributes<HTMLInputElement>
          }
          labelProps={{
            variant: DsTextVariant.BodyMd,
          }}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
        {error && (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        )}
      </Box>
      <Box
        className="add-block-explorer-modal__footer"
        backgroundColor={BackgroundColor.backgroundDefault}
        padding={4}
        width={BlockSize.Full}
      >
        <Button
          isFullWidth
          isDisabled={Boolean(error)}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          data-testid="add-block-explorer-url-button"
          onClick={async () => {
            if (url) {
              onAdded(url);
            }
          }}
        >
          {t('addUrl')}
        </Button>
      </Box>
    </Box>
  );
};

export default AddBlockExplorerModal;
