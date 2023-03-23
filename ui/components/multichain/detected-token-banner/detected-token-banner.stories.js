import React from 'react';
import { DetectedTokensBanner } from './detected-token-banner';

export default {
  title: 'Components/Multichain/DetectedTokensBanner',
  component: DetectedTokensBanner,
  argTypes: {
    actionButtonOnClick: { action: 'setShowDetectedTokens' },
  },
};

export const DefaultStory = (args) => <DetectedTokensBanner {...args} />;

DefaultStory.storyName = 'Default';
