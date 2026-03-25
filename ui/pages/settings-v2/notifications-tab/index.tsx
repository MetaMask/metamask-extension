import React from 'react';
import { Box } from '@metamask/design-system-react';
import NotificationsSettingsContent from '../../notifications-settings/notifications-settings';

const NotificationsTab = () => {
  return (
    <Box paddingTop={4}>
      <NotificationsSettingsContent />
    </Box>
  );
};

export default NotificationsTab;
