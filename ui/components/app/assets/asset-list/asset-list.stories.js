import React from 'react';
import { createMockRouteMessenger } from '../../../../../test/lib/mock-route-messenger';
import { RouteMessengerContext } from '../../../../contexts/route-messenger';
import AssetList from '.';

const routeMessenger = createMockRouteMessenger();

export default {
  title: 'Components/App/AssetList',
  decorators: [
    (Story) => (
      <RouteMessengerContext.Provider value={routeMessenger}>
        <Story />
      </RouteMessengerContext.Provider>
    ),
  ],
  argTypes: {
    onClickAsset: {
      control: 'onClickAsset',
    },
  },
  args: {
    onClickAsset: () => console.log('onClickAsset fired'),
  },
};

export const DefaultStory = (args) => <AssetList {...args} />;

DefaultStory.storyName = 'Default';
