import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';

import { AvatarIcon } from './avatar-icon';
import { IconName } from '../icon';
import { AvatarIconSize } from './avatar-icon.types';

export default {
  title: 'Components/ComponentLibrary/AvatarIcon (deprecated)',
  component: AvatarIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`AvatarIcon` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-avataricon--docs) instead. See the [Migration Guide](https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#from-extension-component-library) for extension migration guidance.',
      },
    },
  },
  argTypes: {
    iconName: {
      options: Object.values(IconName),
      control: 'select',
    },
    size: {
      control: 'select',
      options: Object.values(AvatarIconSize),
    },
    backgroundColor: {
      control: 'select',
      options: Object.values(BackgroundColor),
    },
    color: {
      control: 'select',
      options: Object.values(Color),
    },
    className: {
      control: 'text',
    },
  },
  args: {
    size: AvatarIconSize.Md,
    iconName: IconName.SwapHorizontal,
  },
} as Meta<typeof AvatarIcon>;

const Template: StoryFn<typeof AvatarIcon> = (args) => {
  return <AvatarIcon {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
