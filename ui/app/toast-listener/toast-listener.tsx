import { useEvmTransactionToasts } from './useEvmTransactionToasts';
import { useBridgeSmartStatusToasts } from './useBridgeSmartStatusToasts';
import { useNonEvmTransactionToasts } from './useNonEvmTransactionToasts';

export function ToastListener() {
  useEvmTransactionToasts();
  useNonEvmTransactionToasts();
  useBridgeSmartStatusToasts();

  return null;
}
