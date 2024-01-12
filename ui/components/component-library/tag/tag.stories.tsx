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
    startIconName: {
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

export const StartIconNameStory: StoryFn<typeof Tag> = (args) => (
  <Tag {...args} />
);

StartIconNameStory.args = {
  label: 'Snap Name',
  startIconName: IconName.Snaps,
};

StartIconNameStory.storyName = 'StartIconName';

export const StartIconPropsStory: StoryFn<typeof Tag> = (args) => (
  <Tag {...args} />
);

StartIconPropsStory.args = {
  label: 'Snap Name',
  startIconName: IconName.Snaps,
  startIconProps: {
    color: IconColor.primaryDefault,
  },
};

StartIconPropsStory.storyName = 'StartIconProps';
