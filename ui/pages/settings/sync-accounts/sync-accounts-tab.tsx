import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import SyncAccountsSettings from './sync-accounts-settings';

const SyncAccountsTab = () => {
  return (
    <Box
      paddingHorizontal={3}
      paddingVertical={4}
      flexDirection={BoxFlexDirection.Column}
      className="sync-accounts h-full"
    >
      <SyncAccountsSettings />
    </Box>
  );
};

export default SyncAccountsTab;
