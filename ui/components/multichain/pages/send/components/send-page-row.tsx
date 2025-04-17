// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { Box } from '../../../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';

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
