import React from 'react';
import { Routes, Route } from 'react-router-dom-v5-compat';
import { Box } from '@metamask/design-system-react';
import { CONNECT_HARDWARE_ROUTE } from '../../helpers/constants/routes';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper h-full">
      <Routes>
        <Route
          path={CONNECT_HARDWARE_ROUTE}
          element={<ConnectHardwareForm />}
        />
      </Routes>
    </Box>
  );
}
