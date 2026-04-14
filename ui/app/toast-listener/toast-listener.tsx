import { useEvmTransactionToasts } from './useEvmTransactionToasts';
import { useBridgeSmartStatusToasts } from './useBridgeSmartStatusToasts';
import { useNonEvmTransactionMessengerToasts } from './useNonEvmTransactionMessengerToasts';

export function ToastListener() {
  useEvmTransactionToasts();

  useNonEvmTransactionMessengerToasts();

  useBridgeSmartStatusToasts();

  return null;
}
