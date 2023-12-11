import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { IconName } from '../icon';
import { Tag } from './tag';
import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/Tag',
  component: Tag,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    label: {
      control: 'text',
    },
    iconName: {
      control: 'text',
    },
  },
  args: {
    label: 'Imported',
  },
} as Meta<typeof Tag>;

export const DefaultStory: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

DefaultStory.storyName = 'Default';

export const Label: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

Label.args = {
  label: 'Label Story',
};

export const WithIcon: StoryFn<typeof Tag> = (args) => <Tag {...args} />; // New story to showcase the icon

WithIcon.args = {
  label: 'Snap Name',
  iconName: IconName.Snaps,
};
