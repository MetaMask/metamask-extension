import React from 'react';
import { Meta } from '@storybook/react';
import UnitInput from './unit-input.component';

const UnitInputStory = {
  title: 'Components/UI/UnitInput',
  component: UnitInput,
  argTypes: {
    className: { control: 'text' },
    dataTestId: { control: 'text' },
    children: { control: 'text' },
    actionComponent: { control: 'text' },
    error: { control: 'boolean' },
    onChange: { action: 'changed' },
    onBlur: { action: 'blurred' },
    placeholder: { control: 'text' },
    suffix: { control: 'text' },
    hideSuffix: { control: 'boolean' },
    value: { control: 'text' },
    keyPressRegex: { control: 'text' },
    isDisabled: { control: 'boolean' },
    isFocusOnInput: { control: 'boolean' },
  },
} as Meta<typeof UnitInput>;

export const DefaultStory = (args) => <UnitInput {...args} />;

DefaultStory.storyName = 'default';

DefaultStory.args = {
  className: '',
  dataTestId: 'unit-input',
  children: 'Child Component',
  actionComponent: 'Action Component',
  error: false,
  placeholder: '0',
  suffix: 'ETH',
  hideSuffix: false,
  value: '',
  keyPressRegex: /^\d*(\.|,)?\d*$/u,
  isDisabled: false,
  isFocusOnInput: false,
};

export default UnitInputStory;

export const WithError = DefaultStory.bind({});
WithError.args = {
  ...DefaultStory.args,
  error: true,
};

export const WithSuffixHidden = DefaultStory.bind({});
WithSuffixHidden.args = {
  ...DefaultStory.args,
  hideSuffix: true,
};

export const Disabled = DefaultStory.bind({});
Disabled.args = {
  ...DefaultStory.args,
  isDisabled: true,
};

export const FocusOnInput = DefaultStory.bind({});
FocusOnInput.args = {
  ...DefaultStory.args,
  isFocusOnInput: true,
};
