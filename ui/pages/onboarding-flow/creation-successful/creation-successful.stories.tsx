import React from 'react';
import { RouteMessengerContext } from '../../../contexts/route-messenger';
import { createMockRouteMessenger } from '../../../../test/lib/mock-route-messenger';
import CreationSuccessful from './creation-successful';

const routeMessenger = createMockRouteMessenger();

export default {
  title: 'Pages/OnboardingFlow/CreationSuccessful',
  decorators: [
    (Story) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
};

export const DefaultStory = () => {
  return (
    <div style={{ maxHeight: '2000px' }}>
      <CreationSuccessful />
    </div>
  );
};

DefaultStory.storyName = 'Default';
