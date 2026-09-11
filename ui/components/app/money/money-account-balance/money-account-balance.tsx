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
  FontWeight,
  IconColor,
  SensitiveText,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../component-library';
import { InfoPopover } from '../../musd/info-popover';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountDeposit } from '../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';

export const MONEY_ACCOUNT_BALANCE_TEST_ID = 'money-account-balance';
export const MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID =
  'money-account-balance-value';
export const MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID =
  'money-account-balance-last-known';
export const MONEY_ACCOUNT_BALANCE_APY_TEST_ID = 'money-account-balance-apy';
export const MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID =
  'money-account-balance-skeleton';
export const MONEY_ACCOUNT_BALANCE_INFO_TEST_ID = 'money-account-balance-info';
export const MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID =
  'money-account-balance-add-button';

// The vault APY isn't wired up to a data source yet, so this is shown as a
// fixed placeholder until a hook for it exists.
const PLACEHOLDER_APY = '88%';

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
 * **No live balance, no last-known one, and not loading.** A fetch failure
 * before any success. Showing `$0.00` would assert a zero balance that has not
 * been observed.
 *
 * ## Loading shows a skeleton, not nothing
 *
 * While the first fetch is in flight and there is no figure to show, the row
 * renders with a skeleton in the balance slot — the same treatment mobile's
 * `MoneyBalanceCard` uses — rather than popping into existence when the
 * balance arrives.
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
  const { privacyMode } = useSelector(getPreferences);
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { totalFiatFormatted, lastKnownTotalFiatFormatted, isBalanceLoading } =
    useMoneyAccountBalance();
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();

  const balance = totalFiatFormatted ?? lastKnownTotalFiatFormatted;
  const isLoading = isBalanceLoading && balance === undefined;
  const isLastKnown = totalFiatFormatted === undefined && !isLoading;

  if (!hasMoneyAccount || (balance === undefined && !isLoading)) {
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
      // 458px matches .wallet-overview__buttons ($wallet-overview-sidepanel-max-width - 32px)
      // so this row lines up with the action buttons above it.
      className="w-full max-w-[458px] self-center rounded-2xl"
      data-testid={MONEY_ACCOUNT_BALANCE_TEST_ID}
    >
      <Box flexDirection={BoxFlexDirection.Column} gap={1} className="min-w-0">
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
          >
            {t('moneyBalanceTitle')}
          </Text>
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            • {t('moneyMusd')}
          </Text>
          <InfoPopover
            iconColor={IconColor.IconAlternative}
            ariaLabel={t('moneyBalanceTitle')}
            data-testid={MONEY_ACCOUNT_BALANCE_INFO_TEST_ID}
            wrapperStyle={{ display: 'inline-flex', alignItems: 'center' }}
            position={PopoverPosition.Auto}
            popoverStyle={{
              maxWidth: 315,
              paddingTop: '12px',
              paddingBottom: '16px',
            }}
          >
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
                {t('moneyBalanceInfoBody')}
              </Text>
              <Text variant={TextVariant.BodyMd} color={TextColor.InfoInverse}>
                {t('moneyBalanceInfoWithdrawals')}
              </Text>
            </Box>
          </InfoPopover>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={2}
        >
          {isLoading ? (
            // 32px matches the headingLg line-height of the balance text so
            // the row doesn't shift when the figure arrives.
            <Skeleton
              height={32}
              width={100}
              data-testid={MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID}
            />
          ) : (
            // Honours the privacy-mode setting, as every other balance on the
            // account overview does. Without it, turning balances off would
            // leave the Money row as the one figure still on screen.
            <SensitiveText
              variant={TextVariant.HeadingLg}
              isHidden={privacyMode}
              data-testid={MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID}
            >
              {balance}
            </SensitiveText>
          )}
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
        variant={ButtonVariant.Primary}
        className="shrink-0 "
        isLoading={isDepositLoading}
        data-testid={MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID}
        onClick={() =>
          initiateDeposit().catch((error) =>
            console.error('Failed to initiate money account deposit', error),
          )
        }
      >
        {t('moneyAdd')}
      </Button>
    </Box>
  );
};

export default MoneyAccountBalance;
