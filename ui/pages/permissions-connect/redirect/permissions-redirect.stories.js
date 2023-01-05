import React from 'react';
import PermissionsRedirect from '.';

export default {
  title: 'Pages/PermissionsConnect/Redirect/PermissionsRedirect',

  argTypes: {
    subjectMetadata: {
      control: 'object',
    },
  },
  args: {
    subjectMetadata: {
      extensionId: 'extensionId',
      iconUrl: 'https://airswap-token-images.s3.amazonaws.com/SNX.png',
      subjectType: 'subjectType',
      name: 'name',
      origin: 'origin',
    },
  },
};

export const DefaultStory = (args) => <PermissionsRedirect {...args} />;

DefaultStory.storyName = 'Default';
