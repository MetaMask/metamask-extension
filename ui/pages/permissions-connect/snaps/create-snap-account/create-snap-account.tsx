import React from 'react';
import { Box, Text } from '../../../../components/component-library';
import { TextVariant } from '../../../../helpers/constants/design-system';
// import { useI18nContext } from '../../../../hooks/useI18nContext';

const CreateSnapAccount = () => {
  // const t = useI18nContext();
  return (
    <Box>
      <Text variant={TextVariant.headingLg}>Create Snap Account</Text>
    </Box>
  );
};

export default CreateSnapAccount;
