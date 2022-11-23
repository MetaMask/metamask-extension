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
    name: 'ast',
    src: './AST.png',
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

export const Name = Template.bind({});
Name.args = {
  src: '',
};

export const Src = Template.bind({});

export const ShowHalo = Template.bind({});
ShowHalo.args = {
  showHalo: true,
};

export const ColorBackgroundColorAndBorderColor = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <AvatarToken
      {...args}
      backgroundColor={COLORS.GOERLI}
      borderColor={COLORS.GOERLI}
      name="G"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the AvatarBase component as a prop so we can change the color of the text and to the base avatar
    />
    <AvatarToken
      {...args}
      backgroundColor={COLORS.SEPOLIA}
      borderColor={COLORS.SEPOLIA}
      name="G"
      color={COLORS.PRIMARY_INVERSE} // TODO: This will have to be added to the AvatarBase component as a prop so we can change the color of the text and to the base avatar
    />
  </Box>
);
ColorBackgroundColorAndBorderColor.args = {
  src: '',
};
