import React from 'react';
import { action } from '@storybook/addon-actions';
import ListWithSearch from './list-with-search';

export default {
  title: 'Pages/Swaps/ListWithSearch',
};

export const DefaultStory = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <ListWithSearch onSelect={action('slippage')} />
  </div>
);

DefaultStory.storyName = 'Default';
