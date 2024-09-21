import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import SnapInstall from '.';

const store = configureStore(mockState);

export default {
  title: 'Pages/Snaps/SnapInstall',

  component: SnapInstall,
  argTypes: {},
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => <SnapInstall {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
  },
  requestState: {
    loading: false,
    permissions: {
      'endowment:rpc': {
        caveats: [
          {
            type: 'rpcOrigin',
            value: {
              dapps: true,
            },
          },
        ],
      },
      snap_dialog: {},
      snap_getBip44Entropy: {
        caveats: [
          {
            type: 'permittedCoinTypes',
            value: [
              {
                coinType: 1,
              },
            ],
          },
        ],
      },
    },
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44',
  },
};

export const LoadingStory = (args) => <SnapInstall {...args} />;

LoadingStory.storyName = 'Loading';

LoadingStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
  },
  requestState: {
    loading: true,
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44',
  },
};

export const ScrollingStory = (args) => <SnapInstall {...args} />;

ScrollingStory.storyName = 'Scrolling';

ScrollingStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
  },
  requestState: {
    loading: false,
    permissions: {
      'endowment:rpc': {
        caveats: [
          {
            type: 'rpcOrigin',
            value: {
              dapps: true,
            },
          },
        ],
      },
      'endowment:network-access': {},
      snap_notify: {},
      snap_dialog: {},
      snap_getBip44Entropy: {
        caveats: [
          {
            type: 'permittedCoinTypes',
            value: [
              {
                coinType: 1,
              },
            ],
          },
        ],
      },
    },
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44',
  },
};
