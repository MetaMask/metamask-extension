import React from 'react';
import SrpInput from '.';

export default {
  title: 'Components/App/SrpInput',
  id: __filename,
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
