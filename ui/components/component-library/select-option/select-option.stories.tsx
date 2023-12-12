import { StoryFn, Meta } from '@storybook/react';
import React from 'react';
import {
  AvatarBase,
  AvatarBaseSize,
  SelectWrapper,
  SelectOption,
  SelectButton,
} from '..';

import README from './README.mdx';

export default {
  title: 'Components/ComponentLibrary/SelectOption',
  component: SelectOption,
  parameters: {
    docs: {
      page: README,
    },
  },
  args: {
    // startAccessory: <AvatarBase size={AvatarBaseSize.Sm} />,
    // label: 'Label',
    // description: 'Lorem ipsum Lorem ipsum',
    // endAccessory: <AvatarBase size={AvatarBaseSize.Sm} />,
  },
} as Meta<typeof SelectOption>;

const Template: StoryFn<typeof SelectOption> = (args) => {
  return (
    <SelectWrapper placeholder="Test" triggerComponent={<SelectButton />}>
      <SelectOption {...args} />
    </SelectWrapper>
  );
};

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'Default';
