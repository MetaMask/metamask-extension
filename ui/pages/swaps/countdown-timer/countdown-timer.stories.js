import React from 'react';
import CountdownTimer from './countdown-timer';

export default {
  title: 'Pages/Swaps/CountdownTimer',

  component: CountdownTimer,
  argTypes: {
    timeStarted: {
      type: 'number',
    },
    timeOnly: {
      type: 'boolean',
    },
    timerBase: {
      type: 'number',
    },
    labelKey: {
      type: 'string',
    },
    infoTooltipLabelKey: {
      type: 'string',
    },
    warningTime: {
      type: 'string',
    },
  },
  args: {
    timeStarted: Date.now(),
    timeOnly: false,
    timerBase: 20000,
    labelKey: 'disconnectPrompt',
    infoTooltipLabelKey: 'disconnectAllAccountsConfirmationDescription',
    warningTime: '0:15',
  },
};

export const DefaultStory = (args) => {
  return <CountdownTimer {...args} />;
};

DefaultStory.storyName = 'Default';
