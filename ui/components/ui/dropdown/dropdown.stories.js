import React from 'react';
import README from './README.mdx';
import Dropdown from '.';

const unnamedOptions = [...Array(10).keys()].map((index) => {
  return { value: `option${index}` };
});

const namedOptions = unnamedOptions.map((option, index) => {
  return { ...option, name: `Option ${index}` };
});

const namedOptionsWithVeryLongNames = unnamedOptions.map((option, index) => {
  return {
    ...option,
    name: `Option ${index} with a very${', very'.repeat(index)} long name`,
  };
});

export default {
  title: 'Components/UI/Dropdown',

  component: Dropdown,
  parameters: {
    docs: {
      page: README,
    },
  },
  argTypes: {
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    title: { control: 'text' },
    onChange: { action: 'onChange' },
    options: { control: 'array' },
    selectedOption: { control: 'text' },
    style: { control: 'object' },
  },
};

export const DefaultStory = (args) => <Dropdown {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  disabled: false,
  title: 'Test Dropdown Name',
  options: namedOptions,
  selectedOption: namedOptions[0].value,
};

export const OptionsWithoutNames = (args) => <Dropdown {...args} />;

OptionsWithoutNames.args = {
  disabled: false,
  title: 'Test Dropdown Name',
  options: unnamedOptions,
  selectedOption: unnamedOptions[0].value,
};

export const OptionsWithLongNames = (args) => <Dropdown {...args} />;

OptionsWithLongNames.args = {
  disabled: false,
  title: 'Test Dropdown Name',
  options: namedOptionsWithVeryLongNames,
  selectedOption: namedOptionsWithVeryLongNames[0].value,
};

export const OptionsWithLongNamesAndShortWidth = (args) => (
  <Dropdown {...args} />
);

OptionsWithLongNamesAndShortWidth.args = {
  disabled: false,
  title: 'Test Dropdown Name',
  options: namedOptionsWithVeryLongNames,
  selectedOption: namedOptionsWithVeryLongNames[0].value,
  style: { width: '200px' },
};
