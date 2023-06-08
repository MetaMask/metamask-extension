import React from 'react';
import { Provider } from 'react-redux';

import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import SnapConnect from '.';

const store = configureStore(mockState);

export default {
  title: 'Pages/Snaps/SnapConnect',

  component: SnapConnect,
  argTypes: {},
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const DefaultStory = (args) => <SnapConnect {...args} />;

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
            }
          }
        ]
      }
    }
  },
  targetSubjectMetadata: {
    origin: 'metamask.io',
  },
};

export const ScrollingStory = (args) => <SnapConnect {...args} />;

ScrollingStory.storyName = 'Scrolling';

ScrollingStory.args =  {
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
            }
          }
        ]
      }
    }
  },
  targetSubjectMetadata: {
    origin: 'metamask.io',
  },
};;
