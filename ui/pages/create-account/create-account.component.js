import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '../../components/component-library';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  return (
    <Box className="new-account-wrapper">
      <Routes>
        <Route path="connect" element={<ConnectHardwareForm />} />
      </Routes>
    </Box>
  );
}
