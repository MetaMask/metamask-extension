import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { TextColor } from '../../../helpers/constants/design-system';
import { IconName } from '../../component-library';
import { MultichainAccountMenuItems } from './multichain-account-menu-items';
import { MenuItemConfig } from './multichain-account-menu-items.types';

const meta: Meta<typeof MultichainAccountMenuItems> = {
  title: 'Components/MultichainAccounts/MultichainAccountMenuItems',
  component: MultichainAccountMenuItems,
  parameters: {
    backgrounds: {
      default: 'light',
    },
    docs: {
      description: {
        component:
          'A menu items component for displaying a list of configurable menu options.',
      },
    },
  },
  argTypes: {
    menuConfig: {
      description: 'Configuration array for menu items',
      control: 'object',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '20px',
          maxWidth: '300px',
          border: '1px solid #eee',
          borderRadius: '8px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MultichainAccountMenuItems>;

const defaultMenuConfig: MenuItemConfig[] = [
  {
    textKey: 'accountDetails',
    iconName: IconName.Details,
    onClick: () => console.log('Account details clicked'),
  },
  {
    textKey: 'rename',
    iconName: IconName.Edit,
    onClick: () => console.log('Rename clicked'),
  },
  {
    textKey: 'pin',
    iconName: IconName.Pin,
    onClick: () => console.log('Pin clicked'),
  },
];

export const Default: Story = {
  args: {
    menuConfig: defaultMenuConfig,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state of MultichainAccountMenuItems with standard menu options.',
      },
    },
  },
};

export const WithDisabledItems: Story = {
  args: {
    menuConfig: [
      {
        textKey: 'accountDetails',
        iconName: IconName.Details,
        onClick: () => console.log('Account details clicked'),
      },
      {
        textKey: 'rename',
        iconName: IconName.Edit,
        onClick: () => console.log('Rename clicked'),
        disabled: true,
      },
      {
        textKey: 'pin',
        iconName: IconName.Pin,
        onClick: () => console.log('Pin clicked'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'MultichainAccountMenuItems with some disabled options. Disabled items have reduced opacity and are non-clickable.',
      },
    },
  },
};

export const WithCustomTextColor: Story = {
  args: {
    menuConfig: [
      ...defaultMenuConfig,
      {
        textKey: 'remove',
        iconName: IconName.Trash,
        onClick: () => console.log('Remove clicked'),
        textColor: TextColor.errorDefault,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'MultichainAccountMenuItems with a custom text color for certain options, such as using an error color for destructive actions.',
      },
    },
  },
};
