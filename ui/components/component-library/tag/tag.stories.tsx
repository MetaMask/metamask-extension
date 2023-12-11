import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import { IconName } from '../icon';
import { IconColor } from '../../../helpers/constants/design-system';
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

export const IconNameStory: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

IconNameStory.args = {
  label: 'Snap Name',
  iconName: IconName.Snaps,
};

IconNameStory.storyName = 'IconName';

export const IconPropsStory: StoryFn<typeof Tag> = (args) => <Tag {...args} />;

IconPropsStory.args = {
  label: 'Snap Name',
  iconName: IconName.Snaps,
  iconProps: {
    color: IconColor.primaryDefault,
  },
};

IconPropsStory.storyName = 'IconProps';
