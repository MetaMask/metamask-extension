import React from 'react';
import { Box } from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { ConnectionsHeader } from '../../connections-header';
import { SiteNotConnected } from './components/site-not-connected';

export const Connections = () => (
  <Box
    display={Display.Flex}
    flexDirection={FlexDirection.Column}
    width={BlockSize.Full}
  >
    <ConnectionsHeader />
    <SiteNotConnected />
  </Box>
);
