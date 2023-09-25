import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import SnapsConnect from '.';

const store = configureStore(mockState);

export default {
  title: 'Pages/Snaps/SnapConnect',

  component: SnapsConnect,
  argTypes: {},
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => <SnapsConnect {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
    permissions: {
      wallet_snap: {
        caveats: [
          {
            value: {
              'npm:@metamask/test-snap-bip44': {},
            },
          },
        ],
      },
    },
  },
  targetSubjectMetadata: {
    origin: 'https://metamask.io',
  },
};

export const MultiStory = (args) => <SnapsConnect {...args} />;

MultiStory.storyName = 'Multi';

MultiStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
    permissions: {
      wallet_snap: {
        caveats: [
          {
            value: {
              'npm:@metamask/test-snap-bip44': {},
              'npm:@metamask/test-snap-bip32': {},
              'npm:@metamask/test-snap-getEntropy': {},
            },
          },
        ],
      },
    },
  },
  targetSubjectMetadata: {
    origin: 'https://metamask.io',
  },
};

export const ScrollingStory = (args) => <SnapsConnect {...args} />;

ScrollingStory.storyName = 'Scrolling';

ScrollingStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
    permissions: {
      wallet_snap: {
        caveats: [
          {
            value: {
              'npm:@metamask/test-snap-bip44': {},
              'npm:@metamask/test-snap-bip32': {},
              'npm:@metamask/test-snap-getEntropy': {},
              'npm:@metamask/test-snap-networkAccess': {},
              'npm:@metamask/test-snap-wasm': {},
              'npm:@metamask/test-snap-notify': {},
              'npm:@metamask/test-snap-dialog': {},
            },
          },
        ],
      },
    },
  },
  targetSubjectMetadata: {
    origin: 'https://metamask.io',
  },
};
