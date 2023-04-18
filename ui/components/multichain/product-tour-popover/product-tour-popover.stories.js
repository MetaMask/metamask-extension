import React from 'react';
import { ProductTour } from './product-tour-popover';

export default {
  title: 'Components/Multichain/ProductTour',
  component: ProductTour,
  argTypes: {
    prevIcon: {
      control: 'boolean',
    },
    title: {
      control: 'text',
    },
    description: {
      control: 'text',
    },
    currentStep: {
      control: 'text',
    },
    totalSteps: {
      control: 'text',
    },
    positionObj: {
      control: 'text',
    },
    onClick: {
      control: 'onClick',
    },
  },
  args: {
    prevIcon: true,
    title: 'Permissions',
    description: 'Find your connected accounts and manage permissions here.',
    currentStep: '1',
    totalSteps: '3',
  },
};

const Template = (args) => {
  return <ProductTour {...args} />;
};

export const DefaultStory = Template.bind({});

export const CustomPopoverTipPosition = Template.bind({});
CustomPopoverTipPosition.args = {
  positionObj: '80%',
};
