import React from 'react';
import { ICON_NAMES } from '../icon';
import { BUTTON_TYPES } from './banner.constants';
import { BannerBase } from './banner-base';
import README from './README.mdx';

const marginSizeControlOptions = [
  undefined,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  'auto',
];

export default {
  title: 'Components/ComponentLibrary/BannerBase',
  id: __filename,
  component: BannerBase,
  parameters: {
    docs: {
      page: README,
    },
    backgrounds: { default: 'alternative' },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    icon: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    marginTop: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginRight: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginBottom: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
    marginLeft: {
      options: marginSizeControlOptions,
      control: 'select',
      table: { category: 'box props' },
    },
  },
  args: {
    title: 'Title is sentence case no period',
    description:
      'Description shouldn’t repeat title. 1-3 lines. Can contain a hyperlink.',
    action: 'Action',
  },
};

export const DefaultStory = (args) => <BannerBase {...args} />;

DefaultStory.storyName = 'Default';

export const Icon = (args) => (
  <BannerBase {...args} icon={ICON_NAMES.ADD_SQUARE_FILLED}>
    Button
  </BannerBase>
);
