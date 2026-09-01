import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';

import { Label } from './label';

export default {
  title: 'Components/ComponentLibrary/Label (deprecated)',

  component: Label,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [Label from @metamask/design-system-react] instead.',
      },
    },
  },
  argTypes: {
    htmlFor: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Label',
  },
} as ComponentMeta<typeof Label>;

const Template: ComponentStory<typeof Label> = (args) => <Label {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
