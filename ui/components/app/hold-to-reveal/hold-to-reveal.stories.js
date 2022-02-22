import React from 'react';
import HoldToReveal from './hold-to-reveal';

export default {
  title: 'Components/APP/HoldToReveal',
  id: __filename,
  argTypes: {
    buttonText: { control: 'text' },
    onLongPressed: { action: 'Revealing SRP' },
  },
};

export const DefaultStory = (args) => {
  return <HoldToReveal {...args} />;
};

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  buttonText: 'Hold to reveal SRP',
  onLongPressed: () => console.log('Reveal!'),
};
