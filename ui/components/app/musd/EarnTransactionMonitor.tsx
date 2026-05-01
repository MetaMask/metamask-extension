import React from 'react';
import { useEnsureMusdTokenRegistered } from '../../../hooks/musd/useEnsureMusdTokenRegistered';

const EarnTransactionMonitor: React.FC = () => {
  useEnsureMusdTokenRegistered();
  return null;
};

export default EarnTransactionMonitor;
