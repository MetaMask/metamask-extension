import React from 'react';
import NumericInput from '.';

export default {
  title: 'NumericInput',
};

const onChange = (e) => console.log('changed value: ', e.target.value);

export const numericInput = () => {
  return (
    <div style={{ width: '600px' }}>
      <NumericInput onChange={onChange} />
    </div>
  );
};

export const numericInputWithDetail = () => {
  return (
    <div style={{ width: '600px' }}>
      <NumericInput detailText="= $0.06" onChange={onChange} />
    </div>
  );
};

export const numericInputWithError = () => {
  return (
    <div style={{ width: '600px' }}>
      <NumericInput
        detailText="= $0.06"
        error="This number isn't great"
        onChange={onChange}
      />
    </div>
  );
};
