import React, { useState, useRef } from 'react';
import { ConnectedSitePopover } from './connected-site-popover';
import { AvatarFavicon, Box, PopoverPosition } from '../../component-library';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

export default {
  title: 'Components/Multichain/ConnectedSitePopover',
  component: ConnectedSitePopover,
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    isOpen: true,
    networkImageUrl: './images/eth_logo.svg',
    networkName: 'Avalanche Network C-Chain',
  },
};

export const DefaultStory = {};

export const ConnectedStory = {
  args: {
    isConnected: true,
  },
};
