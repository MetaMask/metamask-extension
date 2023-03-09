import React from 'react';
import { DetectedTokensBanner } from './detected-token-banner';

export default {
  title: 'Components/Multichain/DetectedTokensBanner',
  component: DetectedTokensBanner,
  argTypes: {
    setShowDetectedTokens: { control: 'func' },
  },
  args: {
    setShowDetectedTokens: 'setShowDetectedTokensSpy',
  },
};

export const DefaultStory = (args) => <DetectedTokensBanner {...args} />;

DefaultStory.storyName = 'Default';
