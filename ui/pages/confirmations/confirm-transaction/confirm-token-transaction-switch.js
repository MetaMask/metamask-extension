import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';

export default function ConfirmTokenTransactionSwitch() {
  return (
    <Routes>
      <Route path="*" element={<ConfirmTransactionSwitch />} />
    </Routes>
  );
}
