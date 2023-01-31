import React from 'react';
import {
  ALIGN_ITEMS,
  BORDER_STYLE,
  COLORS,
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
    iconName: {
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
    <Box display={DISPLAY.FLEX} alignItems={ALIGN_ITEMS.FLEX_START} gap={4}>
      <ButtonLink {...args} size={SIZES.AUTO}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text variant={TEXT.BODY_LG_MEDIUM}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={SIZES.INHERIT}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TEXT.BODY_MD}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={SIZES.INHERIT}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TEXT.BODY_SM}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={SIZES.INHERIT}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TEXT.BODY_XS}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={SIZES.INHERIT}>
        Learn more
      </ButtonLink>
    </Text>
  </>
);

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={4}>
    <ButtonLink {...args}>Normal</ButtonLink>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonLink as="a" {...args} href="#" danger>
      Danger
    </ButtonLink>
  </Box>
);

export const Href = (args) => <ButtonLink {...args}>Href example</ButtonLink>;

Href.args = {
  href: '/metamask',
};

export const HitArea = (args) => (
  <>
    <Text marginBottom={4}>Default</Text>
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink {...args} size={SIZES.AUTO}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={SIZES.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add paddingLeft and paddingRight props</Text>
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.FLEX_START}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={SIZES.AUTO}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={SIZES.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={SIZES.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={SIZES.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add block prop</Text>
    <ButtonLink {...args} size={SIZES.LG} block>
      Large block
    </ButtonLink>
  </>
);

HitArea.args = {
  borderColor: COLORS.ERROR_DEFAULT,
  borderStyle: BORDER_STYLE.DASHED,
};
