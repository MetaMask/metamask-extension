import React from 'react';
import SrpInput from '.';

export default {
  title: 'Components/App/SrpInput',

  component: SrpInput,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

const Template = (args) => {
  return <SrpInput {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
