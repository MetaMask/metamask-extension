import React from 'react';
import { Routes, Route } from 'react-router-dom-v5-compat';
import { Box } from '../../components/component-library';
import { CONNECT_HARDWARE_ROUTE } from '../../helpers/constants/routes';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper">
      <Routes>
        <Route
          path={CONNECT_HARDWARE_ROUTE}
          element={<ConnectHardwareForm />}
        />
      </Routes>
    </Box>
  );
}
