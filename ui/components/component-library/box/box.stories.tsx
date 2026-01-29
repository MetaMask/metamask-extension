import React from 'react';
import README from "./README.mdx";
import { StoryFn, Meta } from '@storybook/react';
import {
  BlockSize,
  BorderColor,
  Display,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { Box } from './box';

const sizeControlOptions = [
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
];
const marginSizeControlOptions = [...sizeControlOptions, 'auto'];

export default {
  title: 'Components/ComponentLibrary/Box (deprecated)',
  component: Box,
  parameters: {
    docs: {
      page: README,
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use the equivalent component from [@metamask/design-system-react](https://metamask.github.io/metamask-design-system/) instead.',
      },
    },
    },
  argTypes: {
    children: {
      table: { category: 'children' },
    },
    display: {
      options: Object.values(Display),
      control: 'select',
      table: { category: 'display' },
    },
    borderColor: {
      options: Object.values(BorderColor),
      control: 'select',
      table: { category: 'border' },
    },
    justifyContent: {
      options: Object.values(JustifyContent),
      control: 'select',
      table: { category: 'display' },
    },
    alignItems: {
      options: Object.values(AlignItems),
      control: 'select',
      table: { category: 'display' },
    },
  },
} as Meta<typeof Box>;

export const BoxDefaultStory: StoryFn<typeof Box> = (args) => <Box {...args} />;

BoxDefaultStory.args = {
  children: 'Box component',
  display: Display.Flex,
  justifyContent: JustifyContent.center,
  alignItems: AlignItems.center,
  minWidth: BlockSize.Zero,
  width: BlockSize.Half,
  height: BlockSize.Half,
  borderColor: BorderColor.borderDefault,
  padding: 4,
};

BoxDefaultStory.storyName = 'Default';
