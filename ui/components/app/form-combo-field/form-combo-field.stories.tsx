import React, { useCallback, useState } from 'react';
import FormComboField from './form-combo-field';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: 'Components/App/FormComboField',
  component: FormComboField,
};

export const DefaultStory = () => {
  const [value, setValue] = useState('');

  const handleChange = useCallback(
    (newValue: string) => {
      setValue(newValue);
    },
    [setValue],
  );

  return (
    <div style={{ height: 250 }}>
      <FormComboField
        options={[
          { primaryLabel: 'Berlin', secondaryLabel: 'Germany' },
          { primaryLabel: 'London', secondaryLabel: 'United Kingdom' },
          { primaryLabel: 'Paris', secondaryLabel: 'France' },
        ]}
        onChange={handleChange}
        placeholder="Specify a city..."
        value={value}
      />
    </div>
  );
};

DefaultStory.storyName = 'Default';
