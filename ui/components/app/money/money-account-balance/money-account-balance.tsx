import React from 'react';
import {
  Box,
  BoxBackgroundColor,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';

export const MONEY_ACCOUNT_BALANCE_TEST_ID = 'money-account-balance';
export const MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID =
  'money-account-balance-value';
export const MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID =
  'money-account-balance-last-known';

/**
 * The Money Account balance, or nothing.
 *
 * ## When it renders nothing
 *
 * Two things make this render nothing, and both do so rather than showing a
 * placeholder.
 *
 * **No Money Account.** `useMoneyAccountInfo` reports the feature flag being
 * off, the account not being upgraded, and the availability gate not having
 * answered yet all as `hasMoneyAccount: false` — so this is a single check, not
 * three, and there is no state in which the surface flashes on and then
 * disappears.
 *
 * **No live balance and no last-known one.** A first load, or a fetch failure
 * before any success. Showing `$0.00` would assert a zero balance that has not
 * been observed, and a spinner with no bound on how long it spins is worse than
 * an absent row.
 *
 * ## The last-known balance is labelled as such
 *
 * When the live balance is unavailable but a last-known figure exists for this
 * account and currency, it is shown with an explicit "last known" label. The
 * figure is the whole point of persisting it, but presenting an old number as
 * the current one is exactly the failure the persistence guard exists to
 * prevent, so it is never shown bare.
 *
 * That last-known value survives navigation within this UI instance only — the
 * redux tree here is not rehydrated on restart, so a reopened extension starts
 * with no fallback until the value is mirrored into controller state.
 *
 * @returns The balance row, or `null`.
 */
export const MoneyAccountBalance = () => {
  const t = useI18nContext();
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { totalFiatFormatted, lastKnownTotalFiatFormatted } =
    useMoneyAccountBalance();

  const isLastKnown = totalFiatFormatted === undefined;
  const balance = totalFiatFormatted ?? lastKnownTotalFiatFormatted;

  if (!hasMoneyAccount || balance === undefined) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      padding={4}
      gap={1}
      className="rounded-2xl"
      data-testid={MONEY_ACCOUNT_BALANCE_TEST_ID}
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {t('moneyBalanceTitle')}
      </Text>
      <Text
        variant={TextVariant.HeadingLg}
        data-testid={MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID}
      >
        {balance}
      </Text>
      {isLastKnown ? (
        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.TextAlternative}
          data-testid={MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID}
        >
          {t('moneyBalanceLastKnown')}
        </Text>
      ) : null}
    </Box>
  );
};

export default MoneyAccountBalance;
