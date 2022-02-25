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
  return (
    <div style={{ width: '600px' }}>
      <SrpInput {...args} />
    </div>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
