import React from 'react';
import Divider from './divider';

export default {
  title: 'Components/App/Divider',
  component: Divider,
  argTypes: {
    text: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args) => {
  return (
    <>
      <Divider {...args} />
    </>
  );
};

DefaultStory.storyName = 'Default';
