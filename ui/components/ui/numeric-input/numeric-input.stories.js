import React from 'react';
import NumericInput from '.';

export default {
  title: 'Components/UI/NumericInput',
  id: __filename,
};

const onChange = (e) => console.log('changed value: ', e.target.value);

export const DefaultStory = () => {
  return (
    <div style={{ width: '600px' }}>
      <NumericInput onChange={onChange} />
    </div>
  );
};

DefaultStory.storyName = 'Default';

export const WithDetail = () => {
  return (
    <div style={{ width: '600px' }}>
      <NumericInput detailText="= $0.06" onChange={onChange} />
    </div>
  );
};

export const WithError = () => {
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
