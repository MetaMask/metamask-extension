import React from 'react';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import AddDeviceSettings from './add-device-settings';

const AddDeviceTab = () => {
  return (
    <Box
      paddingHorizontal={3}
      paddingVertical={4}
      flexDirection={BoxFlexDirection.Column}
      className="add-device-tab h-full"
    >
      <AddDeviceSettings />
    </Box>
  );
};

export default AddDeviceTab;
