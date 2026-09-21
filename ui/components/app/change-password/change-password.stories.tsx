import React from 'react';
import { RouteMessengerContext } from '../../../contexts/route-messenger';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import ChangePassword from './change-password';

const mockRouteMessenger = createMockRouteMessenger();

export default {
  title: 'Pages/SettingsPage/ChangePassword',
  decorators: [
    (Story) => (
      <RouteMessengerContext.Provider value={mockRouteMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
};

export const DefaultStory = () => <ChangePassword />;

DefaultStory.storyName = 'Default';
