import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { IconName as IconNameLegacy } from '../../component-library';
import MenuItem from './menu-item';

const meta: Meta<typeof MenuItem> = {
  title: 'Components/UI/MenuItem',
  component: MenuItem,
  decorators: [
    (Story) => (
      <div style={{ width: '280px', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MenuItem>;

export const Default: Story = {
  args: {
    children: 'Menu Item',
    iconName: IconNameLegacy.Eye,
  },
};
