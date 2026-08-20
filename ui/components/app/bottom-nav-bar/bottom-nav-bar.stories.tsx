import type { Meta, StoryObj } from '@storybook/react';
import { BottomNavBar } from './bottom-nav-bar';

const meta: Meta<typeof BottomNavBar> = {
  title: 'Components/App/BottomNavBar',
  component: BottomNavBar,
  parameters: {
    initialEntries: ['/'],
    path: '*',
  },
};

export default meta;
type Story = StoryObj<typeof BottomNavBar>;

export const Default: Story = {};
