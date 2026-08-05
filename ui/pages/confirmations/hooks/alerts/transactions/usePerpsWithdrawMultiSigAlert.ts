'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import type { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { isPerpsWithdrawTransaction } from '../../../../../../shared/lib/transactions.utils';
import { HYPERLIQUID_INFO_API_URL } from '../../../../../../shared/constants/defi-referrals';
import { useAsyncResult } from '../../../../../hooks/useAsync';
import { selectPerpsIsTestnet } from '../../../../../selectors/perps-controller';
import { useConfirmContext } from '../../../context/confirm';
import { AlertsName } from '../constants';

// Session-scoped cache so the alert hook and the footer share one request.
const multiSigStatusByAddress = new Map<string, Promise<boolean>>();

/**
 * Pre-flight check for the HyperLiquid multi-sig status of the account.
 *
 * HyperLiquid rejects every single-signature action from an account that was
 * converted to a multi-sig user (`Multi-sig required`), so the withdrawal
 * would always fail at the final `sendAsset` step. MetaMask cannot produce
 * HyperLiquid multi-sig signatures, so the confirmation is blocked up front:
 * `usePerpsWithdrawMultiSigAlert` blocks a detected multi-sig account, and
 * `pending` keeps the confirm button loading until the check resolves so the
 * withdrawal cannot be submitted before the result is known.
 */
export function usePerpsWithdrawMultiSigCheck(): {
  pending: boolean;
  isMultiSigAccount: boolean;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const isTestnet = useSelector(selectPerpsIsTestnet);

  const isPerpsWithdraw = isPerpsWithdrawTransaction(currentConfirmation);
  const from = currentConfirmation?.txParams?.from as Hex | undefined;

  // This hook runs for every confirmation type, so only query HyperLiquid
  // when the confirmation actually is a perps withdrawal. The endpoint is
  // mainnet-only and multi-sig status differs per network, so testnet mode
  // (a debug toggle) skips the check and fails open.
  const shouldCheck = isPerpsWithdraw && !isTestnet && Boolean(from);

  // The result is tagged with the address it was fetched for, so a response
  // that arrives late (after switching confirmation or account) never gates
  // the current one.
  const { pending, value } = useAsyncResult(async () => {
    if (!shouldCheck || !from) {
      return undefined;
    }

    return { from, isMultiSig: await isHyperliquidMultiSigUser(from) };
  }, [shouldCheck, from]);

  return {
    pending: shouldCheck && pending,
    isMultiSigAccount: Boolean(
      shouldCheck && value && value.from === from && value.isMultiSig,
    ),
  };
}

/**
 * Blocking alert when the account is a HyperLiquid multi-sig user.
 */
export function usePerpsWithdrawMultiSigAlert(): Alert[] {
  const t = useI18nContext();
  const { isMultiSigAccount } = usePerpsWithdrawMultiSigCheck();

  return useMemo(() => {
    if (!isMultiSigAccount) {
      return [];
    }

    return [
      {
        key: AlertsName.PerpsWithdrawMultiSig,
        field: RowAlertKey.PayWith,
        reason: t('alertPerpsWithdrawMultiSigTitle'),
        message: t('alertPerpsWithdrawMultiSigMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [isMultiSigAccount, t]);
}

function isHyperliquidMultiSigUser(address: Hex): Promise<boolean> {
  const cacheKey = address.toLowerCase();
  let status = multiSigStatusByAddress.get(cacheKey);

  if (!status) {
    status = fetchIsMultiSigUser(address);
    multiSigStatusByAddress.set(cacheKey, status);
  }

  return status;
}

async function fetchIsMultiSigUser(address: Hex): Promise<boolean> {
  try {
    const response = await fetch(HYPERLIQUID_INFO_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'userToMultiSigSigners', user: address }),
    });

    if (!response.ok) {
      return false;
    }

    // Returns `{ authorizedUsers, threshold }` for multi-sig users, null
    // otherwise. Only block on a positively identified multi-sig config.
    const result = await response.json();
    return Array.isArray(result?.authorizedUsers);
  } catch {
    // Fail open: never block withdrawals on a failed pre-flight check.
    return false;
  }
}
