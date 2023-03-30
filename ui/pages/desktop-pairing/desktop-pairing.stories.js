import React from 'react';
import DesktopPairingPage from './desktop-pairing.component';

export default {
  title: 'Pages/DesktopPairingPage',
  component: DesktopPairingPage,
  argTypes: {
    showLoadingIndication: {
      action: 'showLoadingIndication',
    },
    hideLoadingIndication: {
      action: 'hideLoadingIndication',
    },
    generateDesktopOtp: {
      action: 'generateDesktopOtp',
    },
  },
  args: {
    mostRecentOverviewPage: '/',
  },
};

export const DefaultStory = (args) => {
  const generateDesktopOtp = async () => Promise.resolve('123456');
  return (
    <DesktopPairingPage {...args} generateDesktopOtp={generateDesktopOtp} />
  );
};

DefaultStory.storyName = 'Default';
