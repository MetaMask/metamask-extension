import React from 'react';
import README from './README.mdx';
import BaseAvatar from './base-avatar';

export default {
  title: 'Components/ComponentLibrary/BaseAvatar',
  id: __filename,
  component: BaseAvatar,
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

export const DefaultBaseAvatar = (args) => {
  return <BaseAvatar {...args} />;
};
DefaultBaseAvatar.storyName = 'Default';
DefaultBaseAvatar.args = {
  size: 'xs',
};
