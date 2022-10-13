import React from 'react';
import RevealSeedPage from './reveal-seed';

export default {
  title: 'Pages/Keychains/RevealSeedPage',
  id: __filename,
  argTypes: {
    requestRevealSeedWords: {
      action: 'requestRevealSeedWords',
    },
    history: {
      control: 'object',
    },
    mostRecentOverviewPage: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => <RevealSeedPage {...args} />;

DefaultStory.storyName = 'Default';
