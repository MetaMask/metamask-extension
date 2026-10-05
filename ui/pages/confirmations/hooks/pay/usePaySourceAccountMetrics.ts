import { useState } from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';

import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  MetaMetricsEventAccountType,
  MetaMetricsHardwareWalletDeviceType,
} from '../../../../../shared/constants/metametrics';
import { getInternalAccountByAddress } from '../../../../selectors/accounts';
import {
  selectPaymentOverrideByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionAccountOverride } from '../transactions/useTransactionAccountOverride';
import { useTransactionPayingAccount } from '../transactions/useTransactionPayingAccount';

/** Fallback when the paying account type cannot be resolved. */
export const CRYPTO_PAY_SOURCE = 'crypto';

const MONEY_ACCOUNT_PAY_SOURCE = 'money-account';

const PAYMENT_OVERRIDE_SOURCES = {
  [PaymentOverride.MoneyAccount]: MONEY_ACCOUNT_PAY_SOURCE,
  [PaymentOverride.Perps]: 'perps',
  [PaymentOverride.Predict]: 'predict',
} as const satisfies Record<PaymentOverride, string>;

type CryptoAccountType = Exclude<
  MetaMetricsEventAccountType,
  MetaMetricsEventAccountType.Hardware
>;

export type PaySourceAccountType =
  | CryptoAccountType
  | MetaMetricsHardwareWalletDeviceType
  | (typeof PAYMENT_OVERRIDE_SOURCES)[PaymentOverride]
  | typeof CRYPTO_PAY_SOURCE;

const KEYRING_SOURCE_TYPES: Record<string, PaySourceAccountType> = {
  [KeyringTypes.money]: MONEY_ACCOUNT_PAY_SOURCE,
  [KeyringTypes.hd]: MetaMetricsEventAccountType.Default,
  [KeyringTypes.simple]: MetaMetricsEventAccountType.Imported,
  [KeyringTypes.snap]: MetaMetricsEventAccountType.Snap,
  [KeyringTypes.ledger]: MetaMetricsHardwareWalletDeviceType.Ledger,
  [KeyringTypes.trezor]: MetaMetricsHardwareWalletDeviceType.Trezor,
  [KeyringTypes.lattice]: MetaMetricsHardwareWalletDeviceType.Lattice,
  [KeyringTypes.qr]: MetaMetricsHardwareWalletDeviceType.QrHardware,
  [KeyringTypes.oneKey]: MetaMetricsHardwareWalletDeviceType.QrHardware,
};

/**
 * Maps a keyring type to the analytics account category. Never returns an
 * address or other identifying data.
 *
 * @param keyringType - Keyring type of the paying account.
 */
export function getPaySourceAccountType(
  keyringType?: string,
): PaySourceAccountType {
  return (
    (keyringType ? KEYRING_SOURCE_TYPES[keyringType] : undefined) ??
    CRYPTO_PAY_SOURCE
  );
}

/**
 * Source account category for MM Pay analytics.
 *
 * `selected` is the current source: the payment override section when one is
 * set, otherwise the paying account's keyring category. `presented` is the
 * first value shown, captured once a pay token exists and, for Money Account
 * deposits, once the funding account override is known so the money account
 * signer is never reported as the payer.
 *
 * @param hasPayToken - Whether a pay token has been selected yet.
 */
export function usePaySourceAccountMetrics(hasPayToken: boolean): {
  presented?: PaySourceAccountType;
  selected: PaySourceAccountType;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  const paymentOverride = useSelector((state: TransactionPayState) =>
    selectPaymentOverrideByTransactionId(state, transactionId),
  );
  const payingAccount = useTransactionPayingAccount();
  const accountOverride = useTransactionAccountOverride();
  const payingKeyringType = useSelector((state) =>
    payingAccount
      ? getInternalAccountByAddress(state, payingAccount)?.metadata?.keyring
          ?.type
      : undefined,
  );

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);
  const isPayingAccountReady =
    !isMoneyAccountDeposit || Boolean(accountOverride);

  const selected = paymentOverride
    ? PAYMENT_OVERRIDE_SOURCES[paymentOverride]
    : getPaySourceAccountType(payingKeyringType);

  const [presented, setPresented] = useState<
    PaySourceAccountType | undefined
  >();
  if (!presented && hasPayToken && isPayingAccountReady) {
    setPresented(selected);
  }

  return { presented, selected };
}
