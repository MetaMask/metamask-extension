import React from 'react';
import { SIZES } from '../../../helpers/constants/design-system';
import { AvatarAccount } from './avatar-account';
import { TYPES } from './avatar-account.constants';

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
      options: Object.values(TYPES),
    },
  },
  args: {
    address: '0x5CfE73b6021E818B776b421B1c4Db2474086a7e1',
    size: SIZES.MD,
    type: TYPES.JAZZICON,
  },
};

export const DefaultStory = (args) => <AvatarAccount {...args} />;

DefaultStory.storyName = 'Default';
