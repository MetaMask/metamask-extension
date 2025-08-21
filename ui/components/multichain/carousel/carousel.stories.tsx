import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from './carousel';

export default {
  title: 'Components/Multichain/Carousel',
  component: Carousel,
  argTypes: {
    slides: {
      control: 'object',
    },
    onClose: {
      control: 'function',
    },
  },
} as Meta<typeof Carousel>;

const mockSlides = [
  {
    id: '1',
    title: 'Components/Multichain/Carousel',
    description: 'This is the first slide description',
    image: './images/sample-image-1.png',
  },
  {
    id: '2',
    title: 'Components/Multichain/Carousel',
    description: 'This is the second slide description',
    image: './images/sample-image-2.png',
  },
  {
    id: '3',
    title: 'Components/Multichain/Carousel',
    description: 'This is the third slide description',
    image: './images/sample-image-3.png',
  },
];

type Story = StoryObj<typeof Carousel>;

const Template: Story = {
  render: (args) => <Carousel {...args} slides={args.slides || mockSlides} />,
};

export const DefaultStory: Story = {
  ...Template,
  args: {
    slides: mockSlides,
  },
};

export const WithCloseButton: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    onClose: (isLastSlide: boolean, id: string) =>
      console.log(`Closing slide with id: ${id}`),
  },
};

export const SingleSlide: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    slides: [mockSlides[0]],
  },
};
