import React from 'react';
import {
  COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  BORDER_COLORS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box/box';

import README from './README.mdx';
import { AvatarNetwork } from './avatar-network';
import { AVATAR_NETWORK_SIZES } from './avatar-network.constants';

export default {
  title: 'Components/ComponentLibrary/AvatarNetwork',

  component: AvatarNetwork,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(AVATAR_NETWORK_SIZES),
    },
    color: {
      options: Object.values(TEXT_COLORS),
      control: 'select',
    },
    backgroundColor: {
      options: Object.values(BACKGROUND_COLORS),
      control: 'select',
    },
    borderColor: {
      options: Object.values(BORDER_COLORS),
      control: 'select',
    },
    name: {
      control: 'text',
    },
    src: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    name: 'Arbitrum One',
    src: './images/arbitrum.svg',
    size: SIZES.MD,
    showHalo: false,
  },
};

const Template = (args) => {
  return <AvatarNetwork {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarNetwork {...args} size={SIZES.XS} />
    <AvatarNetwork {...args} size={SIZES.SM} />
    <AvatarNetwork {...args} size={SIZES.MD} />
    <AvatarNetwork {...args} size={SIZES.LG} />
    <AvatarNetwork {...args} size={SIZES.XL} />
  </Box>
);

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarNetwork {...args} src="./images/matic-token.png" />
    <AvatarNetwork {...args} src="./images/arbitrum.svg" />
    <AvatarNetwork {...args} src="./images/optimism.svg" />
    <AvatarNetwork {...args} src="./images/avax-token.png" />
    <AvatarNetwork {...args} src="./images/palm.svg" />
    <AvatarNetwork {...args} src="./images/bsc-filled.svg" />
    <AvatarNetwork {...args} src="./images/fantom-opera.svg" />
    <AvatarNetwork {...args} src="./images/harmony-one.svg" />
    <AvatarNetwork {...args} src="./images/aurora.png" />
  </Box>
);

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      name="G"
      color={COLORS.PRIMARY_INVERSE} // TODO: update it to COLORS.GOERLI_INVERSE
    />
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.SEPOLIA}
      borderColor={COLORS.SEPOLIA}
      name="S"
      color={COLORS.PRIMARY_INVERSE} // TODO: update it to COLORS.GOERLI_INVERSE
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  src: '',
};
