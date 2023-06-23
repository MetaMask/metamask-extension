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

export const IsChecked = (args) => {
  return <Checkbox {...args} label="isChecked Demo" />;
};

IsChecked.args = {
  isChecked: true,
};

export const IsIndeterminate = (args) => {
  return <Checkbox {...args} label="isIndeterminate Demo" />;
};

IsIndeterminate.args = {
  isIndeterminate: true,
};

export const IsDisabled = (args) => {
  return <Checkbox {...args} label="isDisabled Demo" />;
};

IsDisabled.args = {
  isDisabled: true,
};

export const IsReadOnly = (args) => {
  return <Checkbox {...args} label="isReadOnly Demo" />;
};

IsReadOnly.args = {
  isReadOnly: true,
  isChecked: true,
};

export const OnChange = (args) => {
  const [isChecked, setIsChecked] = React.useState(false);
  return (
    <Checkbox
      {...args}
      onChange={() => setIsChecked(!isChecked)}
      isChecked={isChecked}
      label="onChange Demo"
    />
  );
};

export const IsRequired = (args) => {
  return <Checkbox {...args} label="isRequired Demo" />;
};

IsRequired.args = {
  isRequired: true,
  isChecked: true,
};
