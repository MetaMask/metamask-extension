import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonIcon } from './button-icon';
import { IconName } from '../icon';

export default {
  title: 'Components/ComponentLibrary/ButtonIcon (deprecated)',
  component: ButtonIcon,
  parameters: {
    docs: {
      description: {
        component: '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
  },
  args: {
    iconName: IconName.Close,
    ariaLabel: 'Close',
  },
} as Meta<typeof ButtonIcon>;

const Template: StoryFn<typeof ButtonIcon> = (args) => <ButtonIcon {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
