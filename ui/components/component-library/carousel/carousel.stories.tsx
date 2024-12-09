import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Carousel } from './carousel';

export default {
  title: 'Components/ComponentLibrary/Carousel',
  component: Carousel,
  argTypes: {
    selectedItem: {
      control: 'number',
    },
    showArrows: {
      control: 'boolean',
    },
    showStatus: {
      control: 'boolean',
    },
    autoPlay: {
      control: 'boolean',
    },
    swipeScrollTolerance: {
      control: 'number',
    },
    centerSlidePercentage: {
      control: 'number',
    },
    axis: {
      options: ['horizontal', 'vertical'],
      control: 'select',
    },
    centerMode: {
      control: 'boolean',
    },
    swipeable: {
      control: 'boolean',
    },
  },
} as Meta<typeof Carousel>;

const mockSlides = [
  {
    id: '1',
    title: 'First Slide',
    description: 'This is the first slide description',
    image: './images/sample-image-1.png',
  },
  {
    id: '2',
    title: 'Second Slide',
    description: 'This is the second slide description',
    image: './images/sample-image-2.png',
  },
  {
    id: '3',
    title: 'Third Slide',
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
    selectedItem: 0,
    showArrows: false,
    showStatus: false,
    autoPlay: false,
    swipeScrollTolerance: 5,
    centerMode: true,
    swipeable: true,
  },
};

export const WithArrows: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    showArrows: true,
  },
};

export const SingleSlide: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    slides: [mockSlides[0]],
  },
};

export const AutoPlay: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    autoPlay: true,
  },
};

export const VerticalAxis: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    axis: 'vertical',
  },
};

export const WithCloseButton: Story = {
  ...Template,
  args: {
    ...DefaultStory.args,
    onClose: (id: string) => console.log(`Closing slide with id: ${id}`),
  },
};
