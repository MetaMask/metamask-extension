import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  FormTextField,
  HelpText,
  HelpTextSeverity,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { isWebUrl } from '../../../../../app/scripts/lib/util';

const AddBlockExplorerModal = ({
  onAdded,
}: {
  onAdded: (url: string) => void;
}) => {
  const t = useI18nContext();
  const [url, setUrl] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (url?.length > 0 && !isWebUrl(url)) {
      setError(isWebUrl(`https://${url}`) ? t('urlErrorMsg') : t('invalidRPC'));
    } else {
      setError(undefined);
    }
  }, [url]);

  return (
    <Box padding={4}>
      <FormTextField
        error={Boolean(error)}
        id="additional-rpc-url"
        label={t('blockExplorerUrl')}
        inputProps={{
          variant: TextVariant.bodySm,
        }}
        labelProps={{
          children: undefined,
          variant: TextVariant.bodySmMedium,
        }}
        onChange={(e) => setUrl(e.target.value)}
      />
      {error && (
        <HelpText
          severity={HelpTextSeverity.Danger}
          // marginTop={1}
        >
          {error}
        </HelpText>
      )}

      <ButtonPrimary
        disabled={Boolean(error)}
        size={ButtonPrimarySize.Lg}
        display={Display.Block}
        width={BlockSize.Full}
        marginTop={8}
        marginLeft={'auto'}
        marginRight={'auto'}
        onClick={async () => {
          if (url) {
            onAdded(url);
          }
        }}
      >
        {t('addUrl')}
      </ButtonPrimary>
    </Box>
  );
};

export default AddBlockExplorerModal;
