import React, { useCallback, useState } from 'react';
import FormComboField from './form-combo-field';

/**
 * A form field that supports free text entry or the selection of a value from an attached dropdown list.
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/UI/FormComboField',
  component: FormComboField,
  argTypes: {
    value: {
      control: 'text',
      description: 'The value to display in the field.',
    },
    options: {
      control: 'object',
      description: `The options to display in the dropdown.<br/><br/>
        Must be an array of objects with a \`primaryLabel\` and optionally a \`secondaryLabel\` property.`,
    },
    placeholder: {
      control: 'text',
      description:
        'The placeholder text to display in the field when the value is empty.',
    },
    noOptionsText: {
      control: 'text',
      description: `The text to display in the dropdown when there are no options to display.`,
      table: {
        defaultValue: { summary: 'No options found' },
      },
    },
    maxDropdownHeight: {
      control: 'number',
      description: 'The maximum height of the dropdown in pixels.',
      table: {
        defaultValue: { summary: 179 },
      },
    },
    onChange: {
      description: `Optional callback function to invoke when the value changes.`,
    },
    onOptionClick: {
      description: `Optional callback function to invoke when a dropdown option is clicked.`,
    },
  },
  args: {
    value: undefined,
    options: [
      { primaryLabel: 'Berlin', secondaryLabel: 'Germany' },
      { primaryLabel: 'London', secondaryLabel: 'United Kingdom' },
      { primaryLabel: 'Lisbon', secondaryLabel: 'Portugal' },
      { primaryLabel: 'Paris', secondaryLabel: 'France' },
    ],
    placeholder: 'Specify a city...',
    noOptionsText: undefined,
    maxDropdownHeight: undefined,
    onChange: undefined,
    onOptionClick: undefined,
  },
};

export const DefaultStory = (args) => {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
    },
    [setValue],
  );

  return (
    <div style={{ height: 300 }}>
      <FormComboField {...args} onChange={handleChange} value={value} />
    </div>
  );
};

DefaultStory.storyName = 'With Options';

export const NoOptionsStory = () => {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
    },
    [setValue],
  );

  return (
    <div style={{ height: 300 }}>
      <FormComboField
        value={value}
        options={[]}
        placeholder="Specify a city..."
        noOptionsText="No cities found"
        onChange={handleChange}
      />
    </div>
  );
};

NoOptionsStory.storyName = 'No Options';
