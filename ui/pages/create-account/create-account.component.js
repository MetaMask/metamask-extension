import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@metamask/design-system-react';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper h-full">
      <Routes>
        <Route path="connect" element={<ConnectHardwareForm />} />
      </Routes>
    </Box>
  );
}
