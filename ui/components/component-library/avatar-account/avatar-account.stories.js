import React from 'react';
import { SIZES } from '../../../helpers/constants/design-system';
import { AvatarAccount } from './avatar-account';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/AvatarAccount',
  id: __filename,
  component: AvatarAccount,
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
    address: { control: 'text' },
    type: {
      control: 'select',
      options: ['Jazzicon', 'Blockie'],
    },
  },
  args: {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    size: SIZES.MD,
    type: 'Jazzicon',
  },
};

export const DefaultStory = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';
