import { useContext } from 'react';
import { HardwareWalletContext } from './HardwareWalletContext';
import type { HardwareWalletContextType } from './types';

/**
 * Custom hook to access the HardwareWallet context
 *
 * @returns The hardware wallet context
 * @throws Error if used outside of HardwareWalletProvider
 */
export const useHardwareWallet = (): HardwareWalletContextType => {
  const context = useContext(HardwareWalletContext);

  if (!context) {
    throw new Error(
      'useHardwareWallet must be used within HardwareWalletProvider',
    );
  }

  return context;
};


