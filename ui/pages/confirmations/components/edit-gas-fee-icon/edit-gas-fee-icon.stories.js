import React from 'react';
import EditGasFeeIcon from '.';

export default {
  title: 'Pages/Confirmations/Components/EditGasFeeIcon',
  argTypes: {
    userAcknowledgedGasMissing: {
      control: 'boolean',
    },
  },
  args: {
    userAcknowledgedGasMissing: true,
  },
};

export const DefaultStory = (args) => <EditGasFeeIcon {...args} />;

DefaultStory.storyName = 'Default';
