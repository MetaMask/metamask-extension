import React from 'react';
import { Box, BoxAlignItems, BoxJustifyContent } from '@metamask/design-system-react';
import Preloader from '../../../../../../../components/ui/icon/preloader';

export const ConfirmLoader = () => {
  return (
    <Box
      className="flex"
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      paddingTop={4}
      paddingBottom={4}
    >
      <Preloader size={20} />
    </Box>
  );
};
