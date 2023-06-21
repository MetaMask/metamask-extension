import React from 'react';
import PermissionCell from '.';

export default {
  title: 'Components/App/PermissionCell',

  component: PermissionCell,
};

export const DefaultStory = (args) => <PermissionCell {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Access the Ethereum provider.',
  description:
    'Allow the snap to communicate with MetaMask direct…blockchain and suggest messages and transactions.',
  weight: 1,
  avatarIcon: 'ethereum',
  dateApproved: 1680185432326,
  revoked: false,
};
