import React from 'react';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

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
  args: {
    networkName: 'Arbitrum One',
    networkImageUrl: './images/arbitrum.svg',
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
  <>
    <AvatarNetwork {...args} marginBottom={2} size={SIZES.XS} />
    <AvatarNetwork {...args} marginBottom={2} size={SIZES.SM} />
    <AvatarNetwork {...args} marginBottom={2} size={SIZES.MD} />
    <AvatarNetwork {...args} marginBottom={2} size={SIZES.LG} />
    <AvatarNetwork {...args} marginBottom={2} size={SIZES.XL} />
  </>
);
export const networkName = Template.bind({});
networkName.args = {
  networkImageUrl: '',
};
export const networkImageUrl = Template.bind({});

export const showHalo = Template.bind({});
showHalo.args = {
  showHalo: true,
};

export const BackgroundAndBorderColor = (args) => (
  <>
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
      networkName="K"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
      networkName="R"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      networkName="G"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarNetwork
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
      networkName="R"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
  </>
);
BackgroundAndBorderColor.args = {
  networkImageUrl: '',
};
