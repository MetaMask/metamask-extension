import React from 'react';

import DetectedTokenIgnoredPopover from './detected-token-ignored-popover';

export default {
  title: 'Components/App/DetectedToken/DetectedTokenIgnoredPopover',
  argTypes: {
    onCancelIgnore: {
      action: 'onCancelIgnore',
    },
    handleClearTokensSelection: {
      action: 'handleClearTokensSelection',
    },
    partiallyIgnoreDetectedTokens: {
      control: 'boolean',
    },
    isOpen: {
      control: 'boolean',
    },
  },
  args: {
    partiallyIgnoreDetectedTokens: false,
    isOpen: true,
  },
};

const Template = (args) => {
  return <DetectedTokenIgnoredPopover {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

export const PartiallyIgnoreDetectedTokens = Template.bind({});

PartiallyIgnoreDetectedTokens.args = {
  partiallyIgnoreDetectedTokens: true,
};
