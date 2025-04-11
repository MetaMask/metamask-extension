import React from 'react';

import Jazzicon from './jazzicon.component';
import README from './README.mdx';

export default {
  title: 'Components/UI/Jazzicon',

  component: Jazzicon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    address: { control: 'text' },
    className: { control: 'text' },
    diameter: { control: 'number' },
    tokenList: { control: 'object' },
  },
};

export const DefaultStory = (args) => <Jazzicon {...args} />;

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
  diameter: 32,
};
