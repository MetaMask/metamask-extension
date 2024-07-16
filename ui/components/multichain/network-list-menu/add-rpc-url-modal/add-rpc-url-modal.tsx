import React, { useRef } from 'react';
import {
  Box,
  ButtonPrimary,
  ButtonPrimarySize,
  FormTextField,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const AddUrlModal = ({
  onUrlAdded,
  isRpc,
}: {
  onUrlAdded: (rpcUrl: string) => void;
  isRpc: boolean;
}) => {
  const t = useI18nContext();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Box padding={4}>
      <FormTextField
        inputRef={inputRef}
        id="additional-rpc-url"
        label={isRpc ? t('additionalRpcUrl') : t('additionalBlockExplorerUrl')}
        labelProps={{
          children: undefined,
          variant: TextVariant.bodySmMedium,
        }}
      />

      <ButtonPrimary
        size={ButtonPrimarySize.Lg}
        display={Display.Block}
        width={BlockSize.Full}
        marginTop={8}
        marginLeft={'auto'}
        marginRight={'auto'}
        onClick={async () => {
          if (inputRef.current) {
            onUrlAdded(inputRef.current.value);
          }
        }}
      >
        {t('addUrl')}
      </ButtonPrimary>
    </Box>
  );
};

export default AddUrlModal;
