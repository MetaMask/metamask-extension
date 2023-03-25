import React from 'react';
import {
  AlignItems,
  DISPLAY,
  Size,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { IconName } from '../icon';
import { ButtonSecondary } from './button-secondary';
import { BUTTON_SECONDARY_SIZES } from './button-secondary.constants';
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
      options: Object.values(BUTTON_SECONDARY_SIZES),
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
};

export const DefaultStory = (args) => <ButtonSecondary {...args} />;

DefaultStory.storyName = 'Default';

export const SizeStory = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={AlignItems.baseline} gap={1}>
    <ButtonSecondary {...args} size={Size.SM}>
      Small Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={Size.MD}>
      Medium (Default) Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={Size.LG}>
      Large Button
    </ButtonSecondary>
  </Box>
);
SizeStory.storyName = 'Size';

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonSecondary {...args}>Normal</ButtonSecondary>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonSecondary as="a" {...args} href="#" danger>
      Danger
    </ButtonSecondary>
  </Box>
);
