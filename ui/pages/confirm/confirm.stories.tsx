import React from 'react';
import ConfirmPage from './confirm';

const ConfirmPageStory = {
  title: 'Pages/Confirm/ConfirmPage',
};

export const DefaultStory = (args) => <ConfirmPage {...args} />;

DefaultStory.storyName = 'Default';

export default ConfirmPageStory;
