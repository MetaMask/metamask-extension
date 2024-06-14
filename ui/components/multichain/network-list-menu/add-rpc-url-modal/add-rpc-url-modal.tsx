import React from 'react';
import { Box, Button, ButtonPrimary, ButtonPrimarySize, ButtonVariant, FormTextField, Text } from '../../../component-library';
import { BlockSize, Display, TextVariant } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const AddRpcUrlModal = ({}) => {
  const t = useI18nContext();

  return (
    <Box padding={4}>
      {/* todo is border radius different from deprecated FormField? */}
      <FormTextField id='sdfasdfsdf' label={t('additionalRpcUrl')} labelProps={{
        children: undefined,
        variant:TextVariant.bodySmMedium
      }}/>

      <ButtonPrimary
      size={ButtonPrimarySize.Lg}
      display={Display.Block}
      width={BlockSize.Full}
        marginTop={8}
        marginLeft={'auto'}
        marginRight={'auto'}
      >
        {t('addUrl')}
      </ButtonPrimary>
    </Box>
  );
};

export default AddRpcUrlModal;
