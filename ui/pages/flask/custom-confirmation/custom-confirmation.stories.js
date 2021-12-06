import React from 'react';
import CustomConfirmation from './custom-confirmation';

export default {
  title: 'Pages/Flask/Custom Confirmation',
  id: __filename,
};

export const DefaultStory = (args) => <CustomConfirmation {...args} />;
DefaultStory.storyName = 'Default';
