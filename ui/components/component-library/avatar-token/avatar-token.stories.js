import React from 'react';
import { SIZES } from '../../../helpers/constants/design-system';

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
};

export const DefaultStory = (args) => <AvatarToken {...args} />;

DefaultStory.storyName = 'Default';

export const StoryWithHalo = (args) => <AvatarToken {...args} />;

StoryWithHalo.storyName = 'Halo';

DefaultStory.args = {
  tokenName: 'ast',
  tokenImageUrl: './AST.png',
  size: SIZES.MD,
};

StoryWithHalo.args = {
  tokenName: 'ast',
  tokenImageUrl: './AST.png',
  size: SIZES.MD,
  showHalo: true,
};
