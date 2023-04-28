import React from 'react';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { IconName } from '..';
import { BUTTON_LINK_SIZES } from '../button-link/button-link.constants';
import Box from '../../ui/box/box';
import { Text } from '../text';
import README from './README.mdx';
import { Button, BUTTON_VARIANT } from '.';

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
  title: 'Components/ComponentLibrary/Button',

  component: Button,
  parameters: {
    docs: {
      page: README,
    },
    controls: { sort: 'alpha' },
  },
  argTypes: {
    as: {
      control: 'select',
      options: ['button', 'a'],
    },
    block: {
      control: 'boolean',
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
    },
    href: {
      control: 'text',
    },
    startIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    endIconName: {
      control: 'select',
      options: Object.values(IconName),
    },
    startIconProps: {
      control: 'object',
    },
    endIconProps: {
      control: 'object',
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_LINK_SIZES),
    },
    variant: {
      options: Object.values(BUTTON_VARIANT),
      control: 'select',
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
    children: 'Button',
  },
};

export const DefaultStory = (args) => <Button {...args} />;

DefaultStory.storyName = 'Default';

export const Variant = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <Button variant={BUTTON_VARIANT.PRIMARY} {...args}>
      Button Primary
    </Button>
    <Button variant={BUTTON_VARIANT.SECONDARY} {...args}>
      Button Secondary
    </Button>
    <Button variant={BUTTON_VARIANT.LINK} {...args}>
      Button Link
    </Button>
  </Box>
);

export const SizeStory = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={AlignItems.baseline}
      gap={1}
      marginBottom={3}
    >
      <Button {...args} size={Size.SM}>
        Small Button
      </Button>
      <Button {...args} size={Size.MD}>
        Medium (Default) Button
      </Button>
      <Button {...args} size={Size.LG}>
        Large Button
      </Button>
      <Button {...args} variant={BUTTON_VARIANT.LINK}>
        Auto ButtonLink
      </Button>
    </Box>
    <Text variant={TextVariant.bodySm}>
      <Button {...args} variant={BUTTON_VARIANT.LINK} size={Size.inherit}>
        Button Inherit
      </Button>{' '}
      inherits the font-size of the parent element. Inherit size only used for
      ButtonLink.
    </Text>
  </>
);
SizeStory.storyName = 'Size';

export const Danger = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <Button {...args}>Normal</Button>
    {/* Test Anchor tag to match exactly as button */}
    <Button as="a" {...args} href="#" danger>
      Danger
    </Button>
  </Box>
);

export const Href = (args) => <Button {...args}>Anchor Element</Button>;

Href.args = {
  href: '/metamask',
};

export const Block = (args) => (
  <>
    <Button {...args} marginBottom={2}>
      Default Button
    </Button>
    <Button {...args} block marginBottom={2}>
      Block Button
    </Button>
  </>
);

export const As = (args) => (
  <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.ROW} gap={2}>
    <Button {...args}>Button Element</Button>
    <Button as="a" href="#" {...args}>
      Anchor Element
    </Button>
  </Box>
);

export const Disabled = (args) => <Button {...args}>Disabled Button</Button>;

Disabled.args = {
  disabled: true,
};

export const Loading = (args) => <Button {...args}>Loading Button</Button>;

Loading.args = {
  loading: true,
};

export const StartIconName = (args) => (
  <Button {...args} startIconName={IconName.AddSquare}>
    Button
  </Button>
);

export const EndIconName = (args) => (
  <Button {...args} endIconName={IconName.Arrow2Right}>
    Button
  </Button>
);
