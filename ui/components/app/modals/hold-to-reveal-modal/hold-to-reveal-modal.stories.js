import React from 'react';
import HoldToRevealModal from './hold-to-reveal-modal';

export default {
  title: 'Components/App/Modals/HoldToRevealModal',
  component: HoldToRevealModal,
};

const Template = (args) => <HoldToRevealModal {...args} />;

export const DefaultStory = Template.bind({});

DefaultStory.storyName = 'Default';
