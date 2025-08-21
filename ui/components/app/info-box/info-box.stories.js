import React from 'react';

import InfoBox from '.';

export default {
  title: 'Components/App/InfoBox',

  component: InfoBox,
  argTypes: {
    title: 'Components/App/InfoBox',
    description: 'string',
  },
};

export const DefaultStory = (args) => <InfoBox {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Components/App/InfoBox',
  description: 'This is the description',
};
