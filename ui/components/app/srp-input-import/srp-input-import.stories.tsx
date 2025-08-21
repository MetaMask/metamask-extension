import React from 'react';
import SrpInputImport from '.';

export default {
  title: 'Components/App/SRPInputImport',

  component: SrpInputImport,
  argTypes: {
    onChange: { action: 'changed' },
  },
};

const Template = (args) => {
  return <SrpInputImport {...args} />;
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
