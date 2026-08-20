import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { SensitiveText } from '../../../component-library';
// `SensitiveText` is a legacy component-library component and takes that
// library's `TextVariant`, which is a different enum from the design-system-react
// one used elsewhere in this file even though the values coincide.
import { TextVariant as LegacyTextVariant } from '../../../../helpers/constants/design-system';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';
import { RouteWithMessenger } from '../../../../layouts/route-with-messenger';
import { MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES } from './messenger';

export const MONEY_ACCOUNT_BALANCE_TEST_ID = 'money-account-balance';
export const MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID =
  'money-account-balance-value';
export const MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID =
  'money-account-balance-last-known';
export const MONEY_ACCOUNT_BALANCE_APY_TEST_ID = 'money-account-balance-apy';

// The vault APY isn't wired up to a data source yet, so this is shown as a
// fixed placeholder until a hook for it exists.
const PLACEHOLDER_APY = '4%';

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
const MoneyAccountBalanceContent = () => {
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);
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
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      backgroundColor={BoxBackgroundColor.BackgroundSection}
      padding={4}
      gap={4}
      className="rounded-2xl"
      data-testid={MONEY_ACCOUNT_BALANCE_TEST_ID}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={1} className="min-w-0">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {t('moneyBalanceTitle')} • {t('moneyMusd')}
          </Text>
          <Icon
            name={IconName.Info}
            size={IconSize.Sm}
            color={IconColor.IconAlternative}
          />
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          {/*
            Honours the privacy-mode setting, as every other balance on the
            account overview does. Without it, turning balances off would
            leave the Money row as the one figure still on screen.
          */}
          <SensitiveText
            variant={LegacyTextVariant.headingLg}
            isHidden={privacyMode}
            data-testid={MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID}
          >
            {balance}
          </SensitiveText>
          {/*
            The vault APY isn't wired up to a data source yet, so this is
            always shown alongside a live or last-known balance rather than
            being gated on its own loading state.
          */}
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid={MONEY_ACCOUNT_BALANCE_APY_TEST_ID}
          >
            {t('moneyApy', [PLACEHOLDER_APY])}
          </Text>
        </Box>
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
      <Button
        size={ButtonSize.Md}
        variant={ButtonVariant.Secondary}
        disabled
        className="shrink-0 rounded-full"
      >
        {t('moneyAdd')}
      </Button>
    </Box>
  );
};

/**
 * The Money Account balance, wrapped in the route messenger it needs to call
 * `MoneyAccountAvailabilityService:getAvailability` — see
 * {@link MoneyAccountBalanceContent}. Mounted from multiple places on the
 * account overview, so it carries its own messenger rather than relying on
 * whichever route embeds it to declare the capability.
 */
export const MoneyAccountBalance = () => (
  <RouteWithMessenger
    path="money-account-balance"
    capabilities={MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES}
  >
    <MoneyAccountBalanceContent />
  </RouteWithMessenger>
);

export default MoneyAccountBalance;
