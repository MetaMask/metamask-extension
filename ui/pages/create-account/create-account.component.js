import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@metamask/design-system-react';
import useLedgerDMK from '../confirmations/hooks/useLedgerDMK';
import ConnectHardwareForm from './connect-hardware';

export default function CreateAccountPage() {
  const { dmk, initLedgerDMK } = useLedgerDMK();
  if (!dmk) {
    initLedgerDMK();
  }
  return (
    <Box className="new-account-wrapper h-full">
      <Routes>
        <Route path="connect" element={<ConnectHardwareForm />} />
      </Routes>
    </Box>
  );
}
