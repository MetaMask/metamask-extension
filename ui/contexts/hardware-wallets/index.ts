// Split context exports (recommended - prevents unnecessary rerenders)
export {
  HardwareWalletProvider,
  useHardwareWallet,
  useHardwareWalletConfig,
  useHardwareWalletState,
  useHardwareWalletActions,
} from './HardwareWalletContext.split';

// Legacy exports (for backward compatibility)
export { HardwareWalletContext } from './HardwareWalletContext';

export {
  HardwareWalletErrorProvider,
  useHardwareWalletError,
} from './HardwareWalletErrorProvider';
export { ConnectionState } from './connectionState';
export * from './errors';
export * from './types';
export * from './webHIDUtils';
