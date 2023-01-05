import React from 'react';
import HoldToRevealButton from './hold-to-reveal-button';

export default {
  title: 'Components/App/HoldToRevealButton',

  argTypes: {
    buttonText: { control: 'text' },
    onLongPressed: { action: 'Revealing the SRP' },
  },
};

export const DefaultStory = (args) => {
  return <HoldToRevealButton {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  buttonText: 'Hold to reveal SRP',
  onLongPressed: () => console.log('Revealed'),
};
