import React from 'react';
import RemoveSnapAccount from './remove-snap-account';

export default {
  title: 'Components/UI/RemoveSnapAccount', // title should follow the folder structure location of the component. Don't use spaces.
};

export const DefaultStory = () => (
  <RemoveSnapAccount
    snapId="npm:@metamask/snap-simple-keyring"
    snapName="Test name"
    publicAddress="0x08e11b189afa860a5f9e52780194a92eee888d43"
  />
);

DefaultStory.storyName = 'Default';
