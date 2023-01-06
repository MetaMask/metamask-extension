import React from 'react';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
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
    icon: {
      control: 'select',
      options: Object.values(ICON_NAMES),
      table: { category: 'button base props' },
    },
    iconPositionRight: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    iconProps: {
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

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <ButtonSecondary {...args} size={SIZES.SM}>
      Small Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={SIZES.MD}>
      Medium (Default) Button
    </ButtonSecondary>
    <ButtonSecondary {...args} size={SIZES.LG}>
      Large Button
    </ButtonSecondary>
  </Box>
);

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonSecondary {...args}>Normal</ButtonSecondary>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonSecondary as="a" {...args} href="#" danger>
      Danger
    </ButtonSecondary>
  </Box>
);
