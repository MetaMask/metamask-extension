import React from 'react';

import InfoBox from '.';

export default {
  title: 'Components/App/InfoBox',

  component: InfoBox,
  argTypes: {
    title: 'string',
    description: 'string',
  },
};

export const DefaultStory = (args) => <InfoBox {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Hello Ether',
  description: 'This is the description',
};
