import { useSelector } from 'react-redux';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  PAY_HARDWARE_BLOCKED_TRANSACTION_TYPES,
  PAY_HARDWARE_FLAG_GATED_TRANSACTION_TYPES,
} from '../../constants/pay';
import { selectIsPayHardwareEnabled } from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';

/**
 * Whether the current confirmation forbids funding from a hardware wallet
 * account.
 *
 * Single source of truth for hardware blocking in Pay flows, shared by the
 * account picker (which hides hardware accounts) and
 * `usePayHardwareAccountAlert` (which blocks a hardware account that was
 * already set as `txParams.from`). Keeping both on this hook means the list a
 * user can choose from and the alert that blocks them can never disagree.
 *
 * @returns True when hardware accounts are not valid funding sources for the
 * current confirmation.
 */
export function useIsPayHardwareBlocked(): boolean {
  const transactionMeta = useTransactionMetadataRequestOptional();
  const isPayHardwareEnabled = useSelector(selectIsPayHardwareEnabled);

  const isAlwaysBlockedType = hasTransactionType(
    transactionMeta,
    PAY_HARDWARE_BLOCKED_TRANSACTION_TYPES,
  );

  const isFlagGatedType = hasTransactionType(
    transactionMeta,
    PAY_HARDWARE_FLAG_GATED_TRANSACTION_TYPES,
  );

  return isAlwaysBlockedType || (isFlagGatedType && !isPayHardwareEnabled);
}
