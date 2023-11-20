import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { IconName, Box } from '..';
import README from './README.mdx';
import { ButtonSecondary, ButtonSecondarySize } from '.';

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
  title: 'Components/ComponentLibrary/ButtonSecondary',

  component: ButtonSecondary,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
      table: { category: 'button base props' },
    },
    block: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
    danger: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    startIconName: {
      control: 'select',
      options: Object.values(IconName),
      table: { category: 'button base props' },
    },
    endIconName: {
      control: 'select',
      options: Object.values(IconName),
      table: { category: 'button base props' },
    },
    startIconProps: {
      control: 'object',
      table: { category: 'button base props' },
    },
    endIconProps: {
      control: 'object',
      table: { category: 'button base props' },
    },
    loading: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    size: {
      control: 'select',
      options: Object.values(ButtonSecondarySize),
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
    children: 'Button Secondary',
  },
} as Meta<typeof ButtonSecondary>;

export const DefaultStory = (args) => <ButtonSecondary {...args} />;

DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof ButtonSecondary> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <ButtonSecondary {...args} size={ButtonSecondarySize.Sm}>
      Small Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={ButtonSecondarySize.Md}>
      Medium (Default) Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={ButtonSecondarySize.Lg}>
      Large Button
    </ButtonSecondary>
  </Box>
);
SizeStory.storyName = 'Size';

export const Danger: StoryFn<typeof ButtonSecondary> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <ButtonSecondary {...args}>Normal</ButtonSecondary>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonSecondary as="a" {...args} href="#" danger>
      Danger
    </ButtonSecondary>
  </Box>
);
