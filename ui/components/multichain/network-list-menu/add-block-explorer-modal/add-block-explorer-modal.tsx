import React, { useState } from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
  HelpText,
  HelpTextSeverity,
  Label,
  TextField,
  TextFieldSize,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isWebUrl } from '../../../../../shared/lib/url-utils';

const AddBlockExplorerModal = ({
  onAdded,
}: {
  onAdded: (url: string) => void;
}) => {
  const t = useI18nContext();
  const [url, setUrl] = useState('');
  const error = url.length > 0 && !isWebUrl(url) ? t('urlErrorMsg') : undefined;

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="flex h-full w-full min-h-0 flex-col"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        className="flex min-h-0 flex-1 flex-col overflow-auto px-4 pt-4"
      >
        <Label htmlFor="blockExplorerUrl" className="mb-1">
          {t('blockExplorerUrl')}
        </Label>
        <TextField
          id="blockExplorerUrl"
          size={TextFieldSize.Lg}
          placeholder={t('addAUrl')}
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          isError={Boolean(error)}
          autoFocus
          className="w-full"
          inputProps={
            {
              'data-testid': 'explorer-url-input',
            } as React.ComponentPropsWithoutRef<'input'>
          }
        />
        {error ? (
          <HelpText severity={HelpTextSeverity.Danger}>{error}</HelpText>
        ) : null}
      </Box>
      <Box
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
        className="networks-form__footer networks-form__footer--page w-full shrink-0"
      >
        <Button
          isFullWidth
          isDisabled={Boolean(error)}
          size={ButtonSize.Lg}
          variant={ButtonVariant.Primary}
          data-testid="add-block-explorer-url-button"
          onClick={() => {
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
