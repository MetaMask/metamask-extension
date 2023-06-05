import React from 'react';
import SnapInstall from '.';

export default {
  title: 'UI/Pages/Snaps/SnapInstall',

  component: SnapInstall,
  argTypes: {
  },
};

export const DefaultStory = (args) => <SnapInstall {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  request: {
    metadata: {
      id: 'foo',
    }
  },
  requestState: {
    loading: false,
    permissions: {
      "endowment:rpc": {
        "caveats": [
          {
            "type": "rpcOrigin",
            "value": {
              "dapps": true,
            },
          },
        ],
      },
      "snap_dialog": {},
      "snap_getBip44Entropy": {
        "caveats": [
          {
            "type": "permittedCoinTypes",
            "value": [
              {
                "coinType": 1,
              },
            ],
          },
        ],
      },

    }
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44'
  }
};

export const LoadingStory = (args) => <SnapInstall {...args} />;

LoadingStory.storyName = 'Loading';

LoadingStory.args = {
  request: {
    metadata: {
      id: 'foo',
    }
  },
  requestState: {
    loading: true
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44'
  }
};

export const ScrollingStory = (args) => <SnapInstall {...args} />;

ScrollingStory.storyName = 'Scrolling';

ScrollingStory.args = {
  request: {
    metadata: {
      id: 'foo',
    }
  },
  requestState: {
    loading: false,
    permissions: {
      "endowment:rpc": {
        "caveats": [
          {
            "type": "rpcOrigin",
            "value": {
              "dapps": true,
            },
          },
        ],
      },
      "endowment:network-access": {},
      "snap_notify": {},
      "snap_dialog": {},
      "snap_getBip44Entropy": {
        "caveats": [
          {
            "type": "permittedCoinTypes",
            "value": [
              {
                "coinType": 1,
              },
            ],
          },
        ],
      },

    }
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44'
  }
};

