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

type LabelItem = {
  key: string;
  value: string;
};

type CustodyLabelsArgs = {
  labels: LabelItem[];
  index?: string;
  background?: string;
  hideNetwork?: boolean;
};

export const DefaultStory = (args: CustodyLabelsArgs) => (
  <CustodyLabels {...args} />
);

DefaultStory.storyName = 'CustodyLabels';
