import React from 'react';
import { SIZES } from '../../../helpers/constants/design-system';

// import README from './README.mdx';
import { AvatarNetwork } from './avatar-network';

export default {
  title: 'Components/ComponentLibrary/AvatarNetwork',
  id: __filename,
  component: AvatarNetwork,

  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    networkName: {
      control: 'text',
    },
    networkImageUrl: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => <AvatarNetwork {...args} />;

DefaultStory.storyName = 'Default';

export const AvatarNetworkWithHalo = (args) => <AvatarNetwork {...args} />;

AvatarNetworkWithHalo.storyName = 'Halo';

DefaultStory.args = {
  networkName: 'Arbitrum One',
  networkImageUrl: './images/arbitrum.svg',
  size: SIZES.MD,
};

AvatarNetworkWithHalo.args = {
  networkName: 'Arbitrum One',
  networkImageUrl: './images/arbitrum.svg',
  size: SIZES.MD,
  showHalo: true,
};
