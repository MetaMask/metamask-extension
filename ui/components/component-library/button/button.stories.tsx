import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { Button } from './button';
import { IconName } from '../icon';
import { ButtonSize, ButtonVariant } from './button.types';

export default {
  title: 'Components/ComponentLibrary/Button (deprecated)',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [`Button` from `@metamask/design-system-react`](https://metamask.github.io/metamask-design-system/?path=/docs/react-components-button--docs) instead. See the [Migration Guide](https://github.com/MetaMask/metamask-design-system/blob/main/packages/design-system-react/MIGRATION.md#button-component) for prop and variant mapping details.',
      },
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
    block: {
      control: 'boolean',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    danger: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    href: {
      control: 'text',
    },
    startIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    endIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    startIconProps: {
      control: 'object',
    },
    endIconProps: {
      control: 'object',
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(ButtonSize),
    },
    variant: {
      options: Object.values(ButtonVariant),
      control: 'select',
    },
  },
  args: {
    children: 'Button',
  },
} as Meta<typeof Button>;

const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
