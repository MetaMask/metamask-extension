import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RouteMessengerContext } from '../../contexts/route-messenger';
import { createMockRouteMessenger } from '../../../test/lib/mock-route-messenger';
import RevealSeedPage from './reveal-seed';

const mockRouteMessenger = createMockRouteMessenger();

const meta: Meta<typeof RevealSeedPage> = {
  title: 'Pages/Keychains/RevealSeedPage',
  component: RevealSeedPage,
  decorators: [
    (Story) => (
      <RouteMessengerContext.Provider value={mockRouteMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof RevealSeedPage>;

export const DefaultStory: Story = {
  name: 'Default',
  render: () => <RevealSeedPage />,
};
