import React from 'react';
import {
  BUTTON_SIZES,
  BUTTON_TYPES,
  DISPLAY,
  TEXT,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
import { Text } from '../text';
import { ButtonLink } from './button-link';
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
  title: 'Components/ComponentLibrary/ButtonLink',
  id: __filename,
  component: ButtonLink,
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
    loading: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_SIZES),
    },
    type: {
      control: 'select',
      options: Object.values(BUTTON_TYPES),
    },
    display: {
      options: Object.values(DISPLAY),
      control: 'select',
      table: { category: 'box props' },
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
    // children: 'Button Tertiary',
  },
};

export const DefaultStory = (args) => (
  <>
    <Text variant={TEXT.BODY_MD}>
      Hello web <ButtonLink {...args}>Click Me</ButtonLink> world
    </Text>
  </>
);

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonLink {...args} size={BUTTON_SIZES.AUTO}>
      Auto Button
    </ButtonLink>
    <ButtonLink {...args} size={BUTTON_SIZES.SM}>
      Small Button
    </ButtonLink>
    <ButtonLink {...args} size={BUTTON_SIZES.MD}>
      Medium (Default) Button
    </ButtonLink>
    <ButtonLink {...args} size={BUTTON_SIZES.LG}>
      Large Button
    </ButtonLink>
  </Box>
);

export const Type = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonLink {...args} type={BUTTON_TYPES.NORMAL}>
      Normal
    </ButtonLink>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonLink as="a" {...args} href="#" type={BUTTON_TYPES.DANGER}>
      Danger
    </ButtonLink>
  </Box>
);
