import React from 'react';
import CountdownTimer from './countdown-timer';
import README from './README.mdx';

export default {
  title: 'Pages/Swaps/CountdownTimer',
  id: __filename,
  component: CountdownTimer,
  parameters: {
    docs: {
      page: README,
    },
  },
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
