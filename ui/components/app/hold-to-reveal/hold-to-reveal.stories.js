import React from 'react';
import HoldToReveal from './hold-to-reveal';

export default {
  title: 'Components/APP/HoldToReveal',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <HoldToReveal
      buttonText="holdToReveal"
      timeToHold={5}
      revealFinished={function foo() {
        // do nothing.
      }}
    />
  );
};

DefaultStory.storyName = 'Default';
