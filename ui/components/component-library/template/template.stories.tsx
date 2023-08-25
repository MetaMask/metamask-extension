import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { Template as TemplateComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/Template',
  component: TemplateComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
} as Meta<typeof TemplateComponent>;

const Template: StoryFn<typeof TemplateComponent> = (args) => {
  return <TemplateComponent {...args} />;
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';

export const Demo = Template.bind({});
Demo.args = {};
