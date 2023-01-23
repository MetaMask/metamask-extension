/* eslint-disable react/prop-types */
import React from 'react';
import SetApproveForAllWarning from '.';

export default {
  title: 'Components/App/SetApproveForAllWarning',

  argTypes: {
    collectionName: {
      control: 'text',
    },
    name: {
      control: 'text',
    },
    senderAddress: {
      control: 'text',
    },
    total: {
      control: 'text',
    },
    isERC721: {
      control: 'boolean',
    },
    onSubmit: {
      action: 'onSubmit',
    },
    onCancel: {
      action: 'onCancel',
    },
  },
  args: {
    collectionName: 'Test collection',
    name: 'Account 1',
    senderAddress: '0xee014609ef9e09776ac5fe00bdbfef57bcdefebb',
    total: '6',
    isERC721: true,
  },
};

export const DefaultStory = (args) => <SetApproveForAllWarning {...args} />;

DefaultStory.storyName = 'Default';
