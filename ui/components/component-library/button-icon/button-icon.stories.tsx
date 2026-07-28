import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { ButtonIcon } from './button-icon';
import { IconName } from '../icon';

export default {
  title: 'Components/ComponentLibrary/ButtonIcon (deprecated)',
  component: ButtonIcon,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`ButtonIcon` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-buttonicon--docs) instead. See the [Migration Guide](https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#buttonicon-component) for variant migration details.',
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
