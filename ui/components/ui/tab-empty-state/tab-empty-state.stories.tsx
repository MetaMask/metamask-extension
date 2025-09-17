import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TabEmptyState } from './tab-empty-state';
import { useTheme } from '../../../hooks/useTheme';

// Theme-aware image component for perps trading
const TradingIcon = () => {
  const theme = useTheme();
  const imageSrc =
    theme === 'light'
      ? './images/empty-state-perps-light.png'
      : './images/empty-state-perps-dark.png';

  return (
    <img
      src={imageSrc}
      alt="Trading perps"
      style={{ width: '64px', height: '64px' }}
    />
  );
};

const meta: Meta<typeof TabEmptyState> = {
  title: 'Components/UI/TabEmptyState',
  component: TabEmptyState,
  argTypes: {
    icon: { control: 'object' },
    description: { control: 'text' },
    actionButtonText: { control: 'text' },
    className: { control: 'text' },
  },
  args: {
    icon: <TradingIcon />,
    description: 'Bet on price movements with up to 40x leverage.',
    actionButtonText: 'Trade perps',
  },
};

export default meta;
type Story = StoryObj<typeof TabEmptyState>;

export const Default: Story = {};
