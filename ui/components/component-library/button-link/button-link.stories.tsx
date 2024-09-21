import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  AlignItems,
  BorderColor,
  BorderStyle,
  Display,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { Box, Text } from '..';
import README from './README.mdx';
import { ButtonLink, ButtonLinkSize } from '.';

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
    size: {
      control: 'select',
      options: Object.values(ButtonLinkSize),
    },
  },
  args: {
    children: 'Button Link',
  },
} as Meta<typeof ButtonLink>;

export const DefaultStory: StoryFn<typeof ButtonLink> = (args) => (
  <ButtonLink {...args} />
);

DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof ButtonLink> = (args) => (
  <>
    <Box display={Display.Flex} alignItems={AlignItems.flexStart} gap={4}>
      <ButtonLink {...args} size={ButtonLinkSize.Auto}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Sm}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Md}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Lg}>
        Large
      </ButtonLink>
    </Box>
    <Text variant={TextVariant.bodyLgMedium}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={ButtonLinkSize.Inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodyMd}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={ButtonLinkSize.Inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodySm}>
      Inherits the font-size of the parent element.{' '}
      <ButtonLink {...args} size={ButtonLinkSize.Inherit}>
        Learn more
      </ButtonLink>
    </Text>
    <Text variant={TextVariant.bodyXs}>
      Inherits the font-size of the parent element and example with override for
      a success color.{' '}
      <ButtonLink
        {...args}
        size={ButtonLinkSize.Inherit}
        color={TextColor.successDefault}
      >
        Learn more
      </ButtonLink>
    </Text>
  </>
);
SizeStory.storyName = 'Size';

export const Danger: StoryFn<typeof ButtonLink> = (args) => (
  <Box display={Display.Flex} gap={4}>
    <ButtonLink {...args}>Normal</ButtonLink>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonLink as="a" {...args} href="#" danger>
      Danger
    </ButtonLink>
  </Box>
);

export const Href: StoryFn<typeof ButtonLink> = (args) => (
  <ButtonLink {...args}>Href example</ButtonLink>
);

Href.args = {
  href: '/metamask',
};

export const ExternalLink: StoryFn<typeof ButtonLink> = (args) => (
  <ButtonLink {...args}>Anchor element with external link</ButtonLink>
);

ExternalLink.args = {
  href: 'https://metamask.io/',
  externalLink: true,
};

export const HitArea: StoryFn<typeof ButtonLink> = (args) => (
  <>
    <Text marginBottom={4}>Default</Text>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.flexStart}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink {...args} size={ButtonLinkSize.Auto}>
        Auto (default)
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Sm}>
        Small
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Md}>
        Medium
      </ButtonLink>
      <ButtonLink {...args} size={ButtonLinkSize.Lg}>
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add paddingLeft and paddingRight props</Text>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.flexStart}
      gap={4}
      marginBottom={4}
    >
      <ButtonLink
        {...args}
        paddingLeft={4}
        paddingRight={4}
        size={ButtonLinkSize.Auto}
      >
        Auto (default)
      </ButtonLink>
      <ButtonLink
        {...args}
        paddingLeft={4}
        paddingRight={4}
        size={ButtonLinkSize.Sm}
      >
        Small
      </ButtonLink>
      <ButtonLink
        {...args}
        paddingLeft={4}
        paddingRight={4}
        size={ButtonLinkSize.Md}
      >
        Medium
      </ButtonLink>
      <ButtonLink
        {...args}
        paddingLeft={4}
        paddingRight={4}
        size={ButtonLinkSize.Lg}
      >
        Large
      </ButtonLink>
    </Box>
    <Text marginBottom={4}>Add block prop</Text>
    <ButtonLink {...args} size={ButtonLinkSize.Lg} block>
      Large block
    </ButtonLink>
  </>
);

HitArea.args = {
  borderColor: BorderColor.errorDefault,
  borderStyle: BorderStyle.dashed,
};
