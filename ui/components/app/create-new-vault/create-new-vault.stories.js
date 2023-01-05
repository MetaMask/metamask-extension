import React from 'react';
import CreateNewVault from '.';

export default {
  title: 'Components/App/CreateNewVault',

  argTypes: {
    disabled: { control: 'boolean' },
    submitText: { control: 'text' },
  },
  args: {
    submitText: 'Import',
  },
};

const Template = (args) => {
  return (
    <div style={{ width: '600px' }}>
      <CreateNewVault {...args} />
    </div>
  );
};

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';

export const WithTerms = Template.bind({});
WithTerms.args = { includeTerms: true };
