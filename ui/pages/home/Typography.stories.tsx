import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Typography from '../../components/ui/typography/typography';
import README from './README.mdx';

const meta: Meta<typeof Typography> = {
  title: 'Components/ComponentLibrary/Typography',
  component: Typography,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    variant: {
      control: 'select',
      options: Object.values(TypographyVariant),
    },
    fontWeight: {
      control: 'select',
      options: ['normal', 'bold', 'medium'],
    },
    color: {
      control: 'text',
    },
  },
  args: {
    className: '',
    children: 'Typography Example',
    variant: TypographyVariant.BodyMd,
    fontWeight: 'normal',
    color: '',
  },
};

export default meta;
type Story = StoryObj<typeof Typography>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';

export const Variants: Story = {
  render: (args) => (
    <div>
      <Typography {...args} variant="h1">Heading 1</Typography>
      <Typography {...args} variant="h2">Heading 2</Typography>
      <Typography {...args} variant="h3">Heading 3</Typography>
      <Typography {...args} variant="h4">Heading 4</Typography>
      <Typography {...args} variant="h5">Heading 5</Typography>
      <Typography {...args} variant="h6">Heading 6</Typography>
      <Typography {...args} variant="paragraph">Paragraph</Typography>
      <Typography {...args} variant="body-lg">Body Large</Typography>
      <Typography {...args} variant="body-md">Body Medium</Typography>
      <Typography {...args} variant="body-sm">Body Small</Typography>
    </div>
  ),
};

export const FontWeights: Story = {
  render: (args) => (
    <div>
      <Typography {...args} fontWeight="normal">Normal Weight</Typography>
      <Typography {...args} fontWeight="medium">Medium Weight</Typography>
      <Typography {...args} fontWeight="bold">Bold Weight</Typography>
    </div>
  ),
};

export const Colors: Story = {
  render: (args) => (
    <div>
      <Typography {...args} color="primary">Primary Color</Typography>
      <Typography {...args} color="secondary">Secondary Color</Typography>
      <Typography {...args} color="error">Error Color</Typography>
    </div>
  ),
};
