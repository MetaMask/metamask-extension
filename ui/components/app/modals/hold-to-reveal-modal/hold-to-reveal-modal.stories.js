import React from 'react';
import HoldToRevealModal from '.';

export default {
  title: 'Components/App/Modals/HoldToRevealModal',
  argTypes: {
    onLongPressed: {
      action: 'onLongPressed',
    },
    hideModal: {
      action: 'hideModal',
    },
  },
};

export const DefaultStory = (args) => <HoldToRevealModal {...args} />;

DefaultStory.storyName = 'Default';
