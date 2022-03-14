import React from 'react';
import SrpInput from '.';

export default {
  title: 'Components/App/SrpInput',
  id: __filename,
  argTypes: {
    onChange: { action: 'changed' },
  },
  component: SrpInput,
};

const Template = (args) => {
  return <SrpInput {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
