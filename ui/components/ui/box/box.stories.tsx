import type { Meta, StoryObj } from '@storybook/react';

import {
  BlockSize,
  BorderColor,
  Display,
  AlignItems,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import Box from './box';

export default {
  title: 'Components/UI/Box (deprecated)',
  component: Box,
} satisfies Meta<typeof Box>;

export const DefaultStory: StoryObj<typeof Box> = {
  render: (args) => <Box {...args} />,
  args: {
    children: 'Box component',
    display: Display.Flex,
    justifyContent: JustifyContent.center,
    alignItems: AlignItems.center,
    width: BlockSize.Half,
    height: BlockSize.Half,
    borderColor: BorderColor.borderDefault,
    padding: 4,
  },
  name: 'Default',
};
