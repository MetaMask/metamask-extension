import React from 'react';
import SnapVersion from '.';

export default {
  title: 'Components/App/Snaps/SnapVersion',
  component: SnapVersion,
};
export const DefaultStory = (args) => <SnapVersion {...args} />;

DefaultStory.args = {
  version: '1.4.2',
  url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
};

export const LoadingStory = (args) => <SnapVersion {...args} />;

LoadingStory.args = {
  version: undefined,
  url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
};
