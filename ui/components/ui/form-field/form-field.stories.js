/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import FormField from '.';

export default {
  title: 'Components/UI/FormField (deprecated)',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          '**Deprecated**: This component is deprecated and will be removed in a future release.',
      },
    },
  },
  argTypes: {
    titleText: { control: 'text' },
    titleUnit: { control: 'text' },
    tooltipText: { control: 'text' },
    titleDetail: {
      options: ['text', 'button', 'checkmark'],
      control: { type: 'select' },
    },
    error: { control: 'text' },
    onChange: { action: 'onChange' },
    value: { control: 'number' },
    detailText: { control: 'text' },
    autoFocus: { control: 'boolean' },
    numeric: { control: 'boolean' },
    password: { control: 'boolean' },
    allowDecimals: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: '600px' }}>
      <FormField {...args} onChange={setValue} value={value} />
    </div>
  );
};

DefaultStory.storyName = 'Default';
DefaultStory.args = {
  numeric: false,
  titleText: 'Title',
};
