import React from 'react';
import { TransactionShield } from './';

export default {
  title: 'Pages/Settings/ShieldTransactionTab',
  component: TransactionShield,
};

export const DefaultStory = () => {
  return <TransactionShield />;
};

DefaultStory.storyName = 'Default';
