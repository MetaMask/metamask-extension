import React from 'react';
import CreateSnapAccountContent from './create-snap-account-content';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/UI/CreateSnapAccountContent',
};

export const DefaultStory = () => (
  <CreateSnapAccountContent
    snapId="npm:@metamask/snap-simple-keyring"
    snapName="Test name"
  />
);

DefaultStory.storyName = 'Default';
