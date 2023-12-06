import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import README from './README.mdx';

import { Container as ContainerComponent } from '.';

export default {
  title: 'Components/ComponentLibrary/Container',
  component: ContainerComponent,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
} as Meta<typeof ContainerComponent>;

const Container: StoryFn<typeof ContainerComponent> = (args) => {
  return <ContainerComponent {...args} />;
};

export const DefaultStory = Container.bind({});
DefaultStory.storyName = 'Default';

export const Demo = Container.bind({});
Demo.args = {};
