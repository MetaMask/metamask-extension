import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Box } from '@metamask/design-system-react';
import { CONNECT_HARDWARE_ROUTE } from '../../helpers/constants/routes';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper h-full">
      <Routes>
        <Route path="connect" element={<ConnectHardwareForm />} />
        <Route
          path="*"
          element={<Navigate to={CONNECT_HARDWARE_ROUTE} replace />}
        />
      </Routes>
    </Box>
  );
}
