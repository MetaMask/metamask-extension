import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { TabEmptyState } from './tab-empty-state';

// Mock icons for the different empty states
const TradingIcon = () => (
  <Icon
    name={IconName.Candlestick}
    size={IconSize.Xl}
    color={IconColor.IconMuted}
  />
);

const meta: Meta<typeof TabEmptyState> = {
  title: 'Components/UI/TabEmptyState',
  component: TabEmptyState,
  argTypes: {
    icon: { control: 'object' },
    description: { control: 'text' },
    actionText: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    icon: <TradingIcon />,
    description: 'Bet on price movements with up to 40x leverage.',
    actionText: 'Trade perps',
  },
};

export default meta;
type Story = StoryObj<typeof TabEmptyState>;

export const Default: Story = {};
