import React from 'react';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
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
    <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.FLEX_START} gap={1}>
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
    <Text variant={TEXT.BODY_SM}>
      <ButtonLink {...args} size={SIZES.INHERIT}>
        Inherit Button
      </ButtonLink>{' '}
      inherits the font-size of the parent element.
    </Text>
    <ButtonLink {...args} noPadding>
      No Padding Button
    </ButtonLink>
    <Text variant={TEXT.BODY_SM}>
      No padding does not require a size. Learn more in the noPadding prop docs
      of ButtonLink.
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

export const Href = (args) => <ButtonLink {...args}>Href Example</ButtonLink>;

Href.args = {
  href: '/metamask',
};

export const NoPadding = (args) => (
  <>
    <ButtonLink {...args} noPadding>
      No Padding Button
    </ButtonLink>

    <Text variant={TEXT.BODY_MD} style={{ maxWidth: 400 }} marginBottom={4}>
      No padding prop is used when there is no parent text element wrapping the
      ButtonLink component. When using noPadding, there is no need to pass a
      size since it will be overridden.
    </Text>
    <Box
      style={{ maxWidth: 400 }}
      borderColor={COLORS.BORDER_DEFAULT}
      borderRadius={BORDER_RADIUS.SM}
      padding={2}
    >
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        alignItems={ALIGN_ITEMS.CENTER}
        marginBottom={2}
      >
        <Text variant={TEXT.HEADING_SM} as="h3">
          No padding example
        </Text>
        <ButtonLink noPadding>Action</ButtonLink>
      </Box>
      <Text variant={TEXT.BODY_MD}>
        This is an example of how noPadding prop might be used in a horizontal
        setting (action button top) and a veritcal setting (action button below)
      </Text>
      <ButtonLink noPadding>Action</ButtonLink>
    </Box>
  </>
);
