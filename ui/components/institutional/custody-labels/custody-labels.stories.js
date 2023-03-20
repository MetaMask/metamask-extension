import React from 'react';
import CustodyLabels from '.';

export default {
  title: 'Components/Institutional/CustodyLabels',
  component: CustodyLabels,
  args: {
    labels: [{ key: 'testKey', value: 'value' }],
    index: 'index',
    hideNetwork: 'true',
  },
};

export const DefaultStory = (args) => <CustodyLabels {...args} />;

DefaultStory.storyName = 'CustodyLabels';
