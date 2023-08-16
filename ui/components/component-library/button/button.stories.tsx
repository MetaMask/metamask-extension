import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Box, IconName } from '..';
import { Text } from '../text';
import README from './README.mdx';
import { Button, ButtonSize, ButtonVariant } from '.';

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
      options: Object.values(ButtonSize),
    },
    variant: {
      options: Object.values(ButtonVariant),
      control: 'select',
    },
  },
  args: {
    children: 'Button',
  },
} as Meta<typeof Button>;

<<<<<<< HEAD
const Template: StoryFn<typeof Button> = (args) => <Button {...args} />;
=======
export const DefaultStory: StoryFn<typeof Button> = (args) => (
  <Button {...args} />
);
>>>>>>> 6c19af8604 (button to TS migration)

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Variant: StoryFn<typeof Button> = () => (
  <Box display={Display.Flex} gap={1}>
    <Button variant={ButtonVariant.Primary}>Button Primary</Button>
    <Button variant={ButtonVariant.Secondary}>Button Secondary</Button>
    <Button variant={ButtonVariant.Link}>Button Link</Button>
  </Box>
);

export const SizeStory: StoryFn<typeof Button> = (args) => (
  <>
    <Box
      display={Display.Flex}
      alignItems={AlignItems.baseline}
      gap={1}
      marginBottom={3}
    >
      <Button {...args} variant={ButtonVariant.Primary} size={ButtonSize.Sm}>
        Small Button
      </Button>
      <Button {...args} size={ButtonSize.Md}>
        Medium (Default) Button
      </Button>
      <Button {...args} size={ButtonSize.Lg}>
        Large Button
      </Button>
      <Button {...args} variant={ButtonVariant.Link}>
        Auto ButtonLink
      </Button>
    </Box>
    <Text variant={TextVariant.bodySm}>
      <Button {...args} variant={ButtonVariant.Link} size={ButtonSize.Inherit}>
        Button Inherit
      </Button>{' '}
      inherits the font-size of the parent element. Inherit size only used for
      ButtonLink.
    </Text>
  </>
);
SizeStory.storyName = 'Size';

export const Danger: StoryFn<typeof Button> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <Button {...args}>Normal</Button>
    {/* Test Anchor tag to match exactly as button */}
    <Button as="a" {...args} href="#" danger>
      Danger
    </Button>
  </Box>
);

export const Href: StoryFn<typeof Button> = (args) => (
  <Button {...args}>Anchor Element</Button>
);

Href.args = {
  href: '/metamask',
};

export const Block: StoryFn<typeof Button> = (args) => (
  <>
    <Button {...args} marginBottom={2}>
      Default Button
    </Button>
    <Button {...args} block marginBottom={2}>
      Block Button
    </Button>
  </>
);

export const As: StoryFn<typeof Button> = (args) => (
  <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={2}>
    <Button {...args}>Button Element</Button>
    <Button as="a" href="#" {...args}>
      Anchor Element
    </Button>
  </Box>
);

<<<<<<< HEAD
export const Disabled = Template.bind({});
=======
export const Disabled: StoryFn<typeof Button> = (args) => (
  <Button {...args}>Disabled Button</Button>
);

>>>>>>> 6c19af8604 (button to TS migration)
Disabled.args = {
  disabled: true,
};

<<<<<<< HEAD
export const Loading = Template.bind({});
=======
export const Loading: StoryFn<typeof Button> = (args) => (
  <Button {...args}>Loading Button</Button>
);

>>>>>>> 6c19af8604 (button to TS migration)
Loading.args = {
  loading: true,
};

<<<<<<< HEAD
export const StartIconName = Template.bind({});
StartIconName.args = {
  startIconName: IconName.AddSquare,
};

export const EndIconName = Template.bind({});
EndIconName.args = {
  endIconName: IconName.AddSquare,
};
=======
export const StartIconName: StoryFn<typeof Button> = (args) => (
  <Button {...args} startIconName={IconName.AddSquare}>
    Button
  </Button>
);

export const EndIconName: StoryFn<typeof Button> = (args) => (
  <Button {...args} endIconName={IconName.Arrow2Right}>
    Button
  </Button>
);
>>>>>>> 6c19af8604 (button to TS migration)
