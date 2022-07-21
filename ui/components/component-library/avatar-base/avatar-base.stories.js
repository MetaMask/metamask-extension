import React from 'react';
import README from './README.mdx';
import AvatarBase from './avatar-base';

export default {
  title: 'Components/ComponentLibrary/AvatarBase',
  id: __filename,
  component: AvatarBase,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
  },
};

export const DefaultAvatarBase = (args) => {
  return <AvatarBase {...args} />;
};
DefaultAvatarBase.storyName = 'Default';
DefaultAvatarBase.args = {
  size: 'xs',
};
