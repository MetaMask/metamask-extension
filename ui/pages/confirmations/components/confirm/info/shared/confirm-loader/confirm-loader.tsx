import React from 'react';
import { Box } from '../../../../../../../components/component-library/box/box';
import Preloader from '../../../../../../../components/ui/icon/preloader/preloader-icon.component';
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
      paddingTop={4}
      paddingBottom={4}
    >
      <Preloader size={20} />
    </Box>
  );
};
