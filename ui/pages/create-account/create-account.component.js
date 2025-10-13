import React from 'react';
import { Routes, Route } from 'react-router-dom-v5-compat';
import { Box } from '../../components/component-library';
import { NEW_ACCOUNT_PATHS } from '../../helpers/constants/routes';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper">
      <Routes>
        <Route
          path={NEW_ACCOUNT_PATHS.CONNECT}
          element={<ConnectHardwareForm />}
        />
      </Routes>
    </Box>
  );
}
