import React from 'react';
import { useEnsureMusdTokenRegistered } from '../../../hooks/musd/useEnsureMusdTokenRegistered';

const MusdTokenMonitor: React.FC = () => {
  useEnsureMusdTokenRegistered();
  return null;
};

export default MusdTokenMonitor;
