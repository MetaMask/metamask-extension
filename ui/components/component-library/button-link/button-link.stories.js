import React from 'react';
import {
  AlignItems,
  BorderColor,
  BorderStyle,
  DISPLAY,
  Size,
  TextVariant,
  TextColor,
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
    externalLink: {
      control: 'boolean',
    },
    startIconName: {
      control: 'select',
      options: Object.values(ICON_NAMES),
      table: { category: 'button base props' },
    },
    endIconName: {
      control: 'select',
      options: Object.values(ICON_NAMES),
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

export const SizeStory = (args) => (
  <>
    <Box display={DISPLAY.FLEX} alignItems={AlignItems.flexStart} gap={4}>
      <ButtonLink {...args} size={Size.auto}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={Size.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={Size.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={Size.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text variant={TextVariant.bodyLgMedium}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={Size.inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodyMd}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={Size.inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodySm}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={Size.inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodyXs}>
      Inherits the font-size of the parent element and example with textProps
      override for a success color.{' '}
      <ButtonLink
        {...args}
        size={Size.inherit}
        textProps={{ color: TextColor.successDefault }}
      >
        Learn more
      </ButtonLink>
    </Text>
  </>
);
SizeStory.storyName = 'Size';

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

export const ExternalLink = (args) => (
  <ButtonLink {...args}>Anchor element with external link</ButtonLink>
);

ExternalLink.args = {
  href: 'https://metamask.io/',
  externalLink: true,
};

export const HitArea = (args) => (
  <>
    <Text marginBottom={4}>Default</Text>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexStart}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink {...args} size={Size.auto}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={Size.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={Size.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={Size.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add paddingLeft and paddingRight props</Text>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.flexStart}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={Size.auto}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={Size.SM}>
        Small
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={Size.MD}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} paddingLeft={4} paddingRight={4} size={Size.LG}>
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add block prop</Text>
    <ButtonLink {...args} size={Size.LG} block>
      Large block
    </ButtonLink>
  </>
);

HitArea.args = {
  borderColor: BorderColor.errorDefault,
  borderStyle: BorderStyle.dashed,
};
