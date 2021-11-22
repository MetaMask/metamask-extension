import React from 'react';
import { action } from '@storybook/addon-actions';
import MobileSyncPage from './mobile-sync.component';

export default {
  title: 'Pages/MobileSync',
  id: __filename,
};

export const Base = () => {
  return (
    <MobileSyncPage requestRevealSeedWords={action('Mobile Sync Requested')} />
  );
};
