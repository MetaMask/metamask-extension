import React from 'react';
import TransactionSettings from './transaction-settings';

export default {
  title: 'Pages/Swaps/TransactionSettings',
};

export const DefaultStory = () => (
  <div style={{ height: '200px', marginTop: '160px' }}>
    <TransactionSettings onSelect={() => {}} />
  </div>
);

DefaultStory.storyName = 'Default';
