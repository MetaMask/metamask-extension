import React from 'react';
import SrpInputImport from './srp-input-import';

export default {
  title: 'Components/App/SrpInputImport',

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
