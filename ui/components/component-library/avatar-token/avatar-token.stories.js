import React from 'react';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

import README from './README.mdx';
import { AvatarToken } from './avatar-token';

export default {
  title: 'Components/ComponentLibrary/AvatarToken',
  id: __filename,
  component: AvatarToken,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: Object.values(SIZES),
    },
    tokenName: {
      control: 'text',
    },
    tokenImageUrl: {
      control: 'text',
    },
    showHalo: {
      control: 'boolean',
    },
  },
  args: {
    tokenName: 'ast',
    tokenImageUrl: './AST.png',
    size: SIZES.MD,
    showHalo: false,
  },
};

const Template = (args) => {
  return <AvatarToken {...args} />;
};
export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <>
    <AvatarToken {...args} marginBottom={2} size={SIZES.XS} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.SM} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.MD} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.LG} />
    <AvatarToken {...args} marginBottom={2} size={SIZES.XL} />
  </>
);
export const tokenName = Template.bind({});
tokenName.args = {
  tokenImageUrl: '',
};
export const tokenImageUrl = Template.bind({});

export const showHalo = Template.bind({});
showHalo.args = {
  showHalo: true,
};

export const BackgroundAndBorderColor = (args) => (
  <>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
      tokenName="K"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
      tokenName="R"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      tokenName="G"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
      tokenName="R"
      color={COLORS.PRIMARY_INVERSE} // This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
  </>
);
BackgroundAndBorderColor.args = {
  tokenImageUrl: '',
};
