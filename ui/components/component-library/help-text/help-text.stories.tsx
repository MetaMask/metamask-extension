import React from 'react';
import { StoryFn, Meta } from '@storybook/react';

import { HelpText } from './help-text';

export default {
  title: 'Components/ComponentLibrary/HelpText (deprecated)',
  component: HelpText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release. Please use [HelpText from @metamask/design-system-react](https://metamask.github.io/design-system-react/?path=/docs/components-helptext--docs) instead.',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
    },
    className: {
      control: 'text',
    },
  },
  args: {
    children: 'Help text',
  },
} as Meta<typeof HelpText>;

const Template: StoryFn<typeof HelpText> = (args) => <HelpText {...args} />;

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
