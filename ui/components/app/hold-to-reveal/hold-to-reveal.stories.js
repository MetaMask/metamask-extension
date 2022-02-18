import React from 'react';
import HoldToReveal from './hold-to-reveal';

export default {
  title: 'Components/APP/HoldToReveal',
  id: __filename,
  argTypes: {
    buttonText: { control: 'text' },
    secondsToHold: { control: 'number' },
    revealFinished: { action: 'revealFinished' },
  },
};

export const DefaultStory = (args) => {
  return <HoldToReveal {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  buttonText: 'Hold to reveal SRP',
  secondsToHold: 5,
};
