import React from 'react';
import EnableEIP1559V2Notice from '.';

export default {
  title: 'Components/UI/EnableEIP1559V2Notice', // title should follow the folder structure location of the component. Don't use spaces.
  id: __filename,
  argTypes: {
    isFirstAlert: { control: 'boolean' },
  },
};

export const DefaultStory = (args) => <EnableEIP1559V2Notice {...args} />;

DefaultStory.storyName = 'Default';
