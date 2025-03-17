import React from 'react';
import WhatsNewModal from '.';

export default {
  title: 'Components/Multichain/WhatsNewModal',
  component: WhatsNewModal,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <WhatsNewModal {...args} />;

DefaultStory.storyName = 'Default';
