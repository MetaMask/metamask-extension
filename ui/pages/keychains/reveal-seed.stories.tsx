import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import RevealSeedPage from './reveal-seed';

const meta: Meta<typeof RevealSeedPage> = {
  title: 'Pages/Keychains/RevealSeedPage',
  component: RevealSeedPage,
};

export default meta;

type Story = StoryObj<typeof RevealSeedPage>;

export const DefaultStory: Story = {
  name: 'Default',
  render: () => <RevealSeedPage />,
};
