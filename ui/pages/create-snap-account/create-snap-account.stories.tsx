import React from 'react';
import CreateSnapAccount from './create-snap-account';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/UI/CreateSnapAccount',
};

export const DefaultStory = () => (
  <CreateSnapAccount
    snapId="npm:@metamask/snap-simple-keyring"
    snapName="Test name"
  />
);

DefaultStory.storyName = 'Default';
