import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { SensitiveText } from './sensitive-text';
import { SensitiveTextLength } from './sensitive-text.types';
import README from './README.mdx';
import { Box } from '../box';
import {
  Display,
  FlexDirection,
} from '../../../helpers/constants/design-system';

const meta: Meta<typeof SensitiveText> = {
  title: 'Components/ComponentLibrary/SensitiveText',
  component: SensitiveText,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {
    children: 'Sensitive information',
    isHidden: false,
    length: SensitiveTextLength.Short,
  },
} as Meta<typeof SensitiveText>;

export default meta;
type Story = StoryObj<typeof SensitiveText>;

export const DefaultStory: Story = {};
DefaultStory.storyName = 'Default';

export const Children: Story = {
  args: {
    children: 'Sensitive information',
  },
  render: (args) => <SensitiveText {...args} />,
};

export const IsHidden: Story = {
  args: {
    isHidden: true,
  },
  render: (args) => <SensitiveText {...args} />,
};

export const Length: Story = {
  args: {
    isHidden: true,
  },
  render: (args) => (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <SensitiveText {...args} length={SensitiveTextLength.Short}>
        Length "short" (6 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.Medium}>
        Length "medium" (9 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.Long}>
        Length "long" (12 characters)
      </SensitiveText>
      <SensitiveText {...args} length={SensitiveTextLength.ExtraLong}>
        Length "extra long" (20 characters)
      </SensitiveText>
      <SensitiveText {...args} length="15">
        Length "15" (15 characters)
      </SensitiveText>
    </Box>
  ),
};
