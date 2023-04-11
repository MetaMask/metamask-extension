import React from 'react';
import EditGasDisplay from '.';

export default {
  title: 'Components/App/EditGasDisplay',

  args: {
    transaction: {},
  },
};

export const DefaultStory = (args) => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay {...args} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
