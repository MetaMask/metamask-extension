import React from 'react';
import Box from '../../ui/box/box';
import {
  ALIGN_ITEMS,
  DISPLAY,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import README from './README.mdx';
import { Popover } from '.';

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
  title: 'Components/ComponentLibrary/Popover',
  component: Popover,
  parameters: {
    docs: {
      page: README,
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
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
    children: 'Popover',
  },
};

export const DefaultStory = (args) => (
  <Box
    style={{ height: '200vh', width: '200vw' }}
    display={DISPLAY.FLEX}
    justifyContent={JUSTIFY_CONTENT.CENTER}
    alignItems={ALIGN_ITEMS.CENTER}
  >
    <Popover {...args}>Example</Popover>
  </Box>
);

DefaultStory.storyName = 'Default';
