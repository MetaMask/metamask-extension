import React from 'react';
import { Box } from '../../../../../../../components/component-library';
import Preloader from '../../../../../../../components/ui/icon/preloader';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';

export const ConfirmLoader = () => {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
    >
      <Preloader size={20} />
    </Box>
  );
};
