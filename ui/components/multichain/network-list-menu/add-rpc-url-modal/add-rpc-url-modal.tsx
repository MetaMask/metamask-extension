import React from 'react';
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

const AddRpcUrlModal = () => {
  const t = useI18nContext();

  const showAlert = () => {
    console.log('TODO: add new state!');
  };
  return (
    <Box padding={4}>
      <FormTextField
        id="additional-rpc-url"
        label={t('additionalRpcUrl')}
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
        onClick={showAlert}
      >
        {t('addUrl')}
      </ButtonPrimary>
    </Box>
  );
};

export default AddRpcUrlModal;
