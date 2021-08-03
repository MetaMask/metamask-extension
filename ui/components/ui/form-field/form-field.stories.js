/* eslint-disable react/prop-types */

import React, { useState } from 'react';
import { select } from '@storybook/addon-knobs';
import FormField from '.';

export default {
  title: 'FormField',
};

export const Plain = ({ ...props }) => {
  const options = { text: false, numeric: true };
  const [value, setValue] = useState('');
  return (
    <div style={{ width: '600px' }}>
      <FormField
        onChange={setValue}
        titleText="Title"
        value={value}
        numeric={select('text or numeric', options, options.text)}
        {...props}
      />
    </div>
  );
};

export const FormFieldWithTitleDetail = () => {
  const [clicked, setClicked] = useState(false);
  const detailOptions = {
    text: <div style={{ fontSize: '12px' }}>Detail</div>,
    button: (
      <button
        style={{ backgroundColor: clicked ? 'orange' : 'rgb(239, 239, 239)' }}
        onClick={() => setClicked(!clicked)}
      >
        Click Me
      </button>
    ),
    checkmark: <i className="fas fa-check" />,
  };
  return (
    <Plain
      titleText="Title"
      titleDetail={
        detailOptions[
          select('detailType', ['text', 'button', 'checkmark'], 'text')
        ]
      }
    />
  );
};

export const FormFieldWithError = () => {
  return <Plain titleText="Title" error="Incorrect Format" />;
};
