import React from 'react';

import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { Box } from '../../../../component-library';

export const SendPageRow = ({
  children,
}: {
  children: React.ReactNode | React.ReactNode[];
}) => (
  <Box
    display={Display.Flex}
    paddingBottom={4}
    flexDirection={FlexDirection.Column}
  >
    {children}
  </Box>
);
