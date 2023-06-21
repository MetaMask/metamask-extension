import React from 'react';
import SnapResult from '.';

export default {
  title: 'Pages/Snaps/SnapResult',

  component: SnapResult,
  argTypes: {},
};

export const DefaultStory = (args) => <SnapResult {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
  },
  requestState: {
    loading: false,
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44',
  },
};

export const LoadingStory = (args) => <SnapResult {...args} />;

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

export const ErrorStory = (args) => <SnapResult {...args} />;

ErrorStory.storyName = 'Error';

ErrorStory.args = {
  request: {
    metadata: {
      id: 'foo',
    },
  },
  requestState: {
    loading: false,
    error: 'foo',
  },
  targetSubjectMetadata: {
    origin: 'npm:@metamask/test-snap-bip44',
  },
};
