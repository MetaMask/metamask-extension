import React, { useState } from 'react';
import NumericInput from '.';

export default {
  title: 'Components/UI/NumericInput',
};

export const DefaultStory = () => {
  const [value, setValue] = useState(0);
  return (
    <div style={{ width: '600px' }}>
      <NumericInput onChange={setValue} value={value} />
    </div>
  );
};

DefaultStory.storyName = 'Default';

export const WithDetail = () => {
  const [value, setValue] = useState(0);
  return (
    <div style={{ width: '600px' }}>
      <NumericInput detailText="= $0.06" onChange={setValue} value={value} />
    </div>
  );
};

export const WithError = () => {
  const [value, setValue] = useState(0);
  return (
    <div style={{ width: '600px' }}>
      <NumericInput
        detailText="= $0.06"
        error="This number isn't great"
        onChange={setValue}
        value={value}
      />
    </div>
  );
};
