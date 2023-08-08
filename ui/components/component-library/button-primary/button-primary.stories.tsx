import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import { AlignItems, Display } from '../../../helpers/constants/design-system';
import { Box } from '..';
import README from './README.mdx';
import { ButtonPrimary, ButtonPrimarySize } from '.';

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
    },

    size: {
      control: 'select',
      options: Object.values(ButtonPrimarySize),
    },
  },
  args: {
    children: 'Button Primary',
  },
} as Meta<typeof ButtonPrimary>;

export const DefaultStory: StoryFn<typeof ButtonPrimary> = (args) => (
  <ButtonPrimary {...args} />
);

DefaultStory.storyName = 'Default';

export const SizeStory: StoryFn<typeof ButtonPrimary> = (args) => (
  <Box display={Display.Flex} alignItems={AlignItems.baseline} gap={1}>
    <ButtonPrimary {...args} size={ButtonPrimarySize.Sm}>
      Small Button
    </ButtonPrimary>
    <ButtonPrimary {...args} size={ButtonPrimarySize.Md}>
      Medium (Default) Button
    </ButtonPrimary>
    <ButtonPrimary {...args} size={ButtonPrimarySize.Lg}>
      Large Button
    </ButtonPrimary>
  </Box>
);
SizeStory.storyName = 'Size';

export const Danger: StoryFn<typeof ButtonPrimary> = (args) => (
  <Box display={Display.Flex} gap={1}>
    <ButtonPrimary {...args}>Normal</ButtonPrimary>
    {/* Test Anchor tag to match exactly as button */}
    <ButtonPrimary as="a" {...args} href="#" danger>
      Danger
    </ButtonPrimary>
  </Box>
);
