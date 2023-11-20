import React from 'react';
import SnapConnectCell from '.';

export default {
  title: 'Components/App/Snaps/SnapConnectCell',
  component: SnapConnectCell,
};

export const DefaultStory = (args) => <SnapConnectCell {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  origin: 'aave.com',
  snapId: 'npm:@metamask/example-snap',
};
