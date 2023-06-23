import { Meta } from '@storybook/react';
import React from 'react';

import README from './README.mdx';
import { Checkbox } from '.';

export default {
  title: 'Components/ComponentLibrary/Checkbox',

  component: Checkbox,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {},
  args: {},
} as Meta<typeof Checkbox>;

export const DefaultStory = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <Checkbox
      {...args}
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
    />
  );
};

DefaultStory.storyName = 'Default';

export const Label = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);

  return (
    <Checkbox
      {...args}
      label="Checkbox Label"
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
    />
  );
};
