import React from 'react';
import { action } from '@storybook/addon-actions';
import SlippageButtons from '.';

export default {
  title: 'SlippageButtons',
};

export const Default = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <SlippageButtons onSelect={action('slippage')} />
  </div>
);
