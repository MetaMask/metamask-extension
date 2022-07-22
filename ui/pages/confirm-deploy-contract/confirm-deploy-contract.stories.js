/* eslint-disable react/prop-types */
import React from 'react';
import ConfirmDeployContract from '.';

export default {
  title: 'Pages/ConfirmDeployContract',
  id: __filename,
  component: ConfirmDeployContract,
  argTypes: {
    txData: {
      control: {
        type: 'object',
      },
    },
  },
};

export const DefaultStory = (args) => {
  return <ConfirmDeployContract {...args} />;
};

DefaultStory.storyName = 'Default';
