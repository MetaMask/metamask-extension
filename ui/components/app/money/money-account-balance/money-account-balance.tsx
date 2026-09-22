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
  SensitiveText,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { PopoverPosition } from '../../../component-library';
import { getPreferences } from '../../../../../shared/lib/selectors/preferences';
import { selectMoneyHomeScreenCardEnabled } from '../../../../selectors/money/money-account-feature-flags';
import { isMoneyBalanceFunded } from '../../../../helpers/money/format';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountDeposit } from '../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../hooks/money/useMoneyAccountInfo';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { useTrackOnce } from '../../../../hooks/useTrackOnce';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../pages/money/constants/money-events';
import { TooltipText } from '../tooltip-text';

export const MONEY_ACCOUNT_BALANCE_TEST_ID = 'money-account-balance';
export const MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID =
  'money-account-balance-value';
export const MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID =
  'money-account-balance-last-known';
export const MONEY_ACCOUNT_BALANCE_APY_TEST_ID = 'money-account-balance-apy';
export const MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID =
  'money-account-balance-apy-skeleton';
export const MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID =
  'money-account-balance-skeleton';
export const MONEY_ACCOUNT_BALANCE_INFO_TEST_ID = 'money-account-balance-info';
export const MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID =
  'money-account-balance-add-button';

const AddOrBalance = ({
  fiatBalance,
  showAddButton,
  isLoading,
  privacyMode,
  onAddClick,
  isDepositLoading,
  isLastKnown,
}: {
  fiatBalance: string | undefined;
  showAddButton: boolean;
  isLoading: boolean;
  privacyMode: boolean;
  onAddClick: () => void;
  isDepositLoading: boolean;
  isLastKnown: boolean;
}) => {
  const t = useI18nContext();

  if (showAddButton) {
    return (
      <Button
        size={ButtonSize.Md}
        variant={ButtonVariant.Primary}
        className="shrink-0"
        isLoading={isDepositLoading}
        data-testid={MONEY_ACCOUNT_BALANCE_ADD_BUTTON_TEST_ID}
        onClick={onAddClick}
      >
        {t('moneyAdd')}
      </Button>
    );
  }

  return (
    <>
      {isLoading ? (
        // 22px matches the bodyMd line-height of the balance text so
        // the row doesn't shift when the figure arrives.
        <Skeleton
          height={22}
          width={100}
          data-testid={MONEY_ACCOUNT_BALANCE_SKELETON_TEST_ID}
        />
      ) : (
        // The last-known caption (16px) is absorbed by the card's bottom
        // padding via -mb-4 so the row keeps its height when it appears.
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.End}
          className={isLastKnown ? '-mb-4 shrink-0' : 'shrink-0'}
        >
          <SensitiveText
            variant={TextVariant.BodyMd}
            isHidden={privacyMode}
            fontWeight={FontWeight.Medium}
            data-testid={MONEY_ACCOUNT_BALANCE_VALUE_TEST_ID}
          >
            {fiatBalance}
          </SensitiveText>

          {isLastKnown ? (
            <Text
              variant={TextVariant.BodyXs}
              color={TextColor.TextAlternative}
              className="whitespace-nowrap"
              data-testid={MONEY_ACCOUNT_BALANCE_LAST_KNOWN_TEST_ID}
            >
              {t('moneyBalanceLastKnown')}
            </Text>
          ) : null}
        </Box>
      )}
    </>
  );
};

/**
 * The Money Account balance, or nothing.
 *
 * ## When it renders nothing
 *
 * Three things make this render nothing, and all do so rather than showing a
 * placeholder.
 *
 * **Home card flag off.** `moneyHomeScreenCardEnabled` hides this card on its
 * own, without touching the rest of the Money surface. It cannot show the card
 * when the Money Account feature itself is off.
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
 * ## APY uses the same vault query as Money Home
 *
 * The rate is `apyPercentFormatted` from `useMoneyAccountBalance`, which
 * already calls `MoneyAccountBalanceService:getVaultApy`. While that query is
 * in flight and no override or fallback is available, a skeleton occupies the
 * APY slot. If the query fails with nothing to show, the slot is omitted
 * rather than inventing a rate.
 *
 * @returns The balance row, or `null`.
 */
export const MoneyAccountBalance = () => {
  const t = useI18nContext();
  const { privacyMode } = useSelector(getPreferences);
  const isHomeCardEnabled = useSelector(selectMoneyHomeScreenCardEnabled);
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const {
    tokenTotal,
    totalFiatFormatted,
    lastKnownTotalFiatFormatted,
    isBalanceLoading,
    apyPercentFormatted,
    vaultApyQuery,
  } = useMoneyAccountBalance();
  const { initiateDeposit, isLoading: isDepositLoading } =
    useMoneyAccountDeposit();
  const { trackButtonClicked, trackComponentViewed, trackTooltipClicked } =
    useMoneyAnalytics({
      screenName: MoneyScreenName.WalletHome,
      componentName: MoneyComponentName.BalanceCard,
    });

  const fiatBalance = totalFiatFormatted ?? lastKnownTotalFiatFormatted;
  const isLoading = isBalanceLoading && fiatBalance === undefined;
  const isLastKnown = totalFiatFormatted === undefined && !isLoading;
  const isApyLoading = vaultApyQuery.isLoading && !apyPercentFormatted;
  const isVisible =
    isHomeCardEnabled &&
    hasMoneyAccount &&
    (fiatBalance !== undefined || isLoading);
  const hasLiveUnfundedBalance =
    tokenTotal !== undefined && !isMoneyBalanceFunded(tokenTotal);
  const showAddButton = hasLiveUnfundedBalance && !privacyMode;

  useTrackOnce(isVisible, trackComponentViewed);

  if (!isVisible) {
    return null;
  }

  const handleAddClick = () => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      labelKey: 'moneyAdd',
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    initiateDeposit();
  };

  const handleInfoOpen = () => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.MoneyBalance,
      tooltipType: MoneyTooltipType.Info,
    });
  };

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
          gap={2}
        >
          <TooltipText
            text={t('money')}
            position={PopoverPosition.Auto}
            data-testid={MONEY_ACCOUNT_BALANCE_INFO_TEST_ID}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextDefault}
            onOpen={handleInfoOpen}
            popoverStyle={{
              maxWidth: 315,
              paddingTop: '12px',
              paddingBottom: '16px',
            }}
          >
            <Box flexDirection={BoxFlexDirection.Column} gap={4}>
              <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
                {t('moneyBalanceInfoBody')}
              </Text>
              <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
                {t('moneyBalanceInfoWithdrawals')}
              </Text>
            </Box>
          </TooltipText>

          {isApyLoading ? (
            // 22px matches the bodyMd line-height of the APY text so the
            // row doesn't shift when the figure arrives.
            <Skeleton
              height={22}
              width={72}
              data-testid={MONEY_ACCOUNT_BALANCE_APY_SKELETON_TEST_ID}
            />
          ) : (
            apyPercentFormatted && (
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.SuccessDefault}
                data-testid={MONEY_ACCOUNT_BALANCE_APY_TEST_ID}
              >
                {t('moneyApy', [apyPercentFormatted])}
              </Text>
            )
          )}
        </Box>
      </Box>
      <AddOrBalance
        fiatBalance={fiatBalance}
        showAddButton={showAddButton}
        isLoading={isLoading}
        privacyMode={privacyMode}
        onAddClick={handleAddClick}
        isDepositLoading={isDepositLoading}
        isLastKnown={isLastKnown}
      />
    </Box>
  );
};

export default MoneyAccountBalance;
