import React from 'react';
import { Provider } from 'react-redux';

import SnapConnectCell from '.';
import mockState from '../../../../../test/data/mock-state.json';
import configureStore from '../../../../store/store';

const store = configureStore(mockState);

export default {
  title: 'Components/App/Snaps/SnapConnectCell',
  component: SnapConnectCell,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => <SnapConnectCell {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  origin: 'aave.com',
  snapId: 'npm:@metamask/test-snap-bip44',
};
