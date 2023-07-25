import React from 'react';
import { action } from '@storybook/addon-actions';
import TransactionSettings from './transaction-settings';

export default {
  title: 'Pages/Swaps/TransactionSettings',
};

export const DefaultStory = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <TransactionSettings onSelect={action('slippage')} />
  </div>
);

DefaultStory.storyName = 'Default';
