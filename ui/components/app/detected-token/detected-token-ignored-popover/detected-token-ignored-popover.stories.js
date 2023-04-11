import React from 'react';

import DetectedTokenIgnoredPopover from './detected-token-ignored-popover';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenIgnoredPopover',

  argTypes: {
    onCancelIgnore: {
      control: 'func',
    },
    handleClearTokensSelection: {
      control: 'func',
    },
  },
};

const Template = (args) => {
  return <DetectedTokenIgnoredPopover {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
