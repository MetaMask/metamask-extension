import React from 'react';
import README from './README.mdx';
import CircleIcon from './circle-icon.component';

export default {
  title: 'Components/UI/CircleIcon',
  id: __filename,
  component: CircleIcon,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    size: { control: 'text' },
    circleClass: { control: 'text' },
    iconSource: { control: 'text' },
    iconSize: { control: 'text' },
  },
};

export const DefaultStory = (args) => (
  <CircleIcon
    border="1px solid"
    borderColor="black"
    background="white"
    iconSize={args.iconSize}
    iconSource={args.iconSource}
  />
);

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  iconSize: '42px',
  iconSource: 'images/eth_logo.svg',
};
