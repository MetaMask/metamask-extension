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
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <AvatarToken {...args} size={SIZES.XS} />
    <AvatarToken {...args} size={SIZES.SM} />
    <AvatarToken {...args} size={SIZES.MD} />
    <AvatarToken {...args} size={SIZES.LG} />
    <AvatarToken {...args} size={SIZES.XL} />
  </Box>
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

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.KOVAN}
      borderColor={COLORS.KOVAN}
      tokenName="K"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.RINKEBY}
      borderColor={COLORS.RINKEBY}
      tokenName="R"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      tokenName="G"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.ROPSTEN}
      borderColor={COLORS.ROPSTEN}
      tokenName="R"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the BaseAvatar component as a prop so we can change the color of the text and to the base avatar
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  tokenImageUrl: '',
};
