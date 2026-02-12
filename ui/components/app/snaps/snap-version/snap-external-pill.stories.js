import React from 'react';
import SnapExternalPill from '.';

export default {
  title: 'Components/App/Snaps/SnapExternalPill',
  component: SnapExternalPill,
};
export const DefaultStory = (args) => <SnapExternalPill {...args} />;

DefaultStory.args = {
  value: '1.4.2',
  url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
};

export const LoadingStory = (args) => <SnapExternalPill {...args} />;

LoadingStory.args = {
  value: undefined,
  url: 'https://www.npmjs.com/package/@metamask/test-snap-error',
};
