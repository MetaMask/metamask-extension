import React from 'react';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
import { ButtonPrimary } from './button-primary';
import { BUTTON_PRIMARY_SIZES } from './button-primary.constants';
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
  title: 'Components/ComponentLibrary/ButtonPrimary',

  component: ButtonPrimary,
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
      options: Object.values(BUTTON_PRIMARY_SIZES),
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
    children: 'Button Primary',
  },
};

export const DefaultStory = (args) => <ButtonPrimary {...args} />;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
    <ButtonPrimary {...args} size={SIZES.SM}>
      Small Button
    </ButtonPrimary>
    <ButtonPrimary {...args} size={SIZES.MD}>
      Medium (Default) Button
    </ButtonPrimary>
    <ButtonPrimary {...args} size={SIZES.LG}>
      Large Button
    </ButtonPrimary>
  </Box>
);

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonPrimary {...args}>Normal</ButtonPrimary>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonPrimary as="a" {...args} href="#" danger>
      Danger
    </ButtonPrimary>
  </Box>
);
