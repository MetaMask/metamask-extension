import React from 'react';
import { action } from '@storybook/addon-actions';
import SlippageButtons from '.';

export default {
  title: 'Pages/Swaps/SlippageButtons',
  id: __filename,
};

export const DefaultStory = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <SlippageButtons onSelect={action('slippage')} />
  </div>
);

DefaultStory.storyName = 'Default';
