import React from 'react';
import WhatsNewPopup from '.';

export default {
  title: 'Components/Multichain/WhatsNewPopup',
  component: WhatsNewPopup,
  argTypes: {
    onClose: {
      action: 'onClose',
    },
  },
};

export const DefaultStory = (args) => <WhatsNewPopup {...args} />;

DefaultStory.storyName = 'Default';
