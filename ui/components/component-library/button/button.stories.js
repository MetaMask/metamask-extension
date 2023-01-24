import React from 'react';
import {
  ALIGN_ITEMS,
  DISPLAY,
  FLEX_DIRECTION,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import { ICON_NAMES } from '../icon';
import { BUTTON_LINK_SIZES } from '../button-link/button-link.constants';
import Box from '../../ui/box/box';
import { Text } from '../text';
import README from './README.mdx';
import { Button, BUTTON_TYPES } from '.';

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
    iconName: {
      control: 'select',
      options: Object.values(ICON_NAMES),
    },
    iconPositionRight: {
      control: 'boolean',
    },
    iconProps: {
      control: 'object',
    },
    loading: {
      control: 'boolean',
    },
    size: {
      control: 'select',
      options: Object.values(BUTTON_LINK_SIZES),
    },
    type: {
      options: Object.values(BUTTON_TYPES),
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

export const Type = (args) => (
  <Box display={DISPLAY.FLEX} gap={1}>
    <Button type={BUTTON_TYPES.PRIMARY} {...args}>
      Button Primary
    </Button>
    <Button type={BUTTON_TYPES.SECONDARY} {...args}>
      Button Secondary
    </Button>
    <Button type={BUTTON_TYPES.LINK} {...args}>
      Button Link
    </Button>
  </Box>
);

export const Size = (args) => (
  <>
    <Box
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.BASELINE}
      gap={1}
      marginBottom={3}
    >
      <Button {...args} size={SIZES.SM}>
        Small Button
      </Button>
      <Button {...args} size={SIZES.MD}>
        Medium (Default) Button
      </Button>
      <Button {...args} size={SIZES.LG}>
        Large Button
      </Button>
    </Box>
    <Text variant={TEXT.BODY_SM}>
      <Button {...args} type={BUTTON_TYPES.LINK} size={SIZES.AUTO}>
        Button Auto
      </Button>{' '}
      inherits the font-size of the parent element. Auto size only used for
      ButtonLink.
    </Text>
  </>
);

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

export const IconName = (args) => <Button {...args}>Button</Button>;

IconName.args = {
  iconName: ICON_NAMES.ADD_SQUARE_FILLED,
};
