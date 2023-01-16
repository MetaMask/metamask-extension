import React from 'react';
import {
  ALIGN_ITEMS,
  DISPLAY,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import Box from '../../ui/box/box';
import { ICON_NAMES } from '../icon';
import { Text } from '../text';
import { ButtonLink } from './button-link';
import { BUTTON_LINK_SIZES } from './button-link.constants';
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
    danger: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
      table: { category: 'button base props' },
    },
    href: {
      control: 'text',
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
      options: Object.values(BUTTON_LINK_SIZES),
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
    children: 'Button Link',
  },
};

export const DefaultStory = (args) => <ButtonLink {...args} />;

DefaultStory.storyName = 'Default';

export const Size = (args) => (
  <>
    <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.BASELINE} gap={1}>
      <ButtonLink {...args} size={SIZES.SM}>
        Small Button
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.MD}>
        Medium (Default) Button
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.LG}>
        Large Button
      </ButtonLink>
    </Box>
    <Text variant={TEXT.BODY_MD}>
      <ButtonLink {...args} size={SIZES.AUTO}>
        Button Auto
      </ButtonLink>{' '}
      inherits the font-size of the parent element.
    </Text>
  </>
);

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <ButtonLink {...args}>Normal</ButtonLink>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonLink as="a" {...args} href="#" danger>
      Danger
    </ButtonLink>
  </Box>
);

export const Href = (args) => <ButtonLink {...args}>Anchor Element</ButtonLink>;

Href.args = {
  href: '/metamask',
};
