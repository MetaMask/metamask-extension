import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import type { Hex } from '@metamask/utils';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import { moneyFormatUsd } from '../../helpers/money/format';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../pages/money/constants/money-events';
import {
  selectMoneyAssetOverviewBalanceCtaEnabled,
  selectMoneyEarnBannerEnabled,
} from '../../selectors/money/money-account-feature-flags';
import { useTrackOnce } from '../useTrackOnce';
import { calculateMoneyProjectedEarnings } from './money-deposit-token-utils';
import {
  useMoneyDepositCtaEligibility,
  type MoneyDepositCtaToken,
} from './use-money-deposit-cta-eligibility';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { useMoneyVaultApy } from './useMoneyVaultApy';

export const MONEY_EARN_BANNER_CTA_LABEL_KEY = 'moneyEarnBannerCta';
export const MONEY_START_EARNING_LABEL_KEY = 'moneyStartEarning';

export type MoneyAssetOverviewToken = MoneyDepositCtaToken &
  Pick<TokenWithFiatAmount, 'balance' | 'symbol'>;

/**
 * Shared eligibility, deposit, and analytics plumbing for one token details
 * Money CTA surface.
 *
 * @param token - The token whose details page is shown.
 * @param isFlagEnabled - The surface's own feature flag.
 * @param componentName - The surface's analytics component name.
 */
function useMoneyAssetOverviewCta(
  token: MoneyAssetOverviewToken,
  isFlagEnabled: boolean,
  componentName: MoneyComponentName,
) {
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { getEligibleFiatAmountUsd } = useMoneyDepositCtaEligibility();
  const fiatAmountUsd = getEligibleFiatAmountUsd(token);
  const isEligible =
    isFlagEnabled && hasMoneyAccount && fiatAmountUsd !== undefined;

  const vaultApy = useMoneyVaultApy({ enabled: isEligible });
  const { initiateDeposit } = useMoneyAccountDeposit();
  const analytics = useMoneyAnalytics({
    screenName: MoneyScreenName.AssetDetail,
    componentName,
  });

  const tokenProperties = useMemo(
    () => ({
      tokenSymbol: token.symbol,
      tokenChainId: token.chainId,
      tokenPositionInList: 1,
      tokensInList: 1,
      tokenHasBalance: Number(token.balance) > 0,
    }),
    [token.balance, token.chainId, token.symbol],
  );

  const deposit = useCallback(() => {
    initiateDeposit({
      preferredPaymentToken: {
        address: token.address as Hex,
        chainId: token.chainId as Hex,
      },
    });
  }, [initiateDeposit, token.address, token.chainId]);

  return {
    isEligible,
    fiatAmountUsd,
    vaultApy,
    analytics,
    tokenProperties,
    deposit,
  };
}

/**
 * The dismissible "Earn up to X% APY" banner on token details.
 *
 * @param token - The token whose details page is shown.
 * @returns Visibility, the APY to show (if known), and click handlers.
 */
export function useMoneyEarnBanner(token: MoneyAssetOverviewToken) {
  const isFlagEnabled = useSelector(selectMoneyEarnBannerEnabled);
  const { isEligible, vaultApy, analytics, tokenProperties, deposit } =
    useMoneyAssetOverviewCta(
      token,
      isFlagEnabled,
      MoneyComponentName.EarnBanner,
    );
  const { trackTokenButtonClicked, trackTokenSurfaceClicked } = analytics;

  const onBannerClick = useCallback(() => {
    trackTokenSurfaceClicked({
      ...tokenProperties,
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    deposit();
  }, [deposit, tokenProperties, trackTokenSurfaceClicked]);

  const onCtaClick = useCallback(() => {
    trackTokenButtonClicked({
      ...tokenProperties,
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      labelKey: MONEY_EARN_BANNER_CTA_LABEL_KEY,
      labelSubstitutions: [token.symbol],
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    deposit();
  }, [deposit, token.symbol, tokenProperties, trackTokenButtonClicked]);

  const onDismiss = useCallback(() => {
    trackTokenButtonClicked({
      ...tokenProperties,
      buttonType: MoneyButtonType.Icon,
      buttonIntent: MoneyButtonIntent.Dismiss,
    });
  }, [tokenProperties, trackTokenButtonClicked]);

  const { apyPercent, apyPercentFormatted } = vaultApy;

  return {
    isVisible: isEligible,
    apyPercentFormatted:
      apyPercent !== undefined && apyPercent > 0
        ? apyPercentFormatted
        : undefined,
    onBannerClick,
    onCtaClick,
    onDismiss,
  };
}

/**
 * The Money earn CTA in the token details "Your balance" section: projected
 * earnings, the APY on the balance row, and a "Start earning" button. Hidden
 * until an APY is available, as the copy cannot be shown without it.
 *
 * @param token - The token whose details page is shown.
 * @returns The values to display, or `undefined` when hidden, and handlers.
 */
export function useMoneyAssetOverviewBalanceCta(
  token: MoneyAssetOverviewToken,
) {
  const isFlagEnabled = useSelector(selectMoneyAssetOverviewBalanceCtaEnabled);
  const {
    isEligible,
    fiatAmountUsd,
    vaultApy,
    analytics,
    tokenProperties,
    deposit,
  } = useMoneyAssetOverviewCta(
    token,
    isFlagEnabled,
    MoneyComponentName.AssetOverviewBalanceCta,
  );
  const { trackComponentViewed, trackTokenButtonClicked, trackTooltipClicked } =
    analytics;
  const { apyDecimal, apyPercent, apyPercentFormatted } = vaultApy;

  const projectedEarningsFormatted = useMemo(
    () =>
      fiatAmountUsd === undefined || apyDecimal === undefined
        ? undefined
        : `+${moneyFormatUsd(
            new BigNumber(
              calculateMoneyProjectedEarnings(
                fiatAmountUsd,
                apyDecimal,
              ).toString(),
            ),
          )}`,
    [apyDecimal, fiatAmountUsd],
  );

  const onStartEarning = useCallback(() => {
    trackTokenButtonClicked({
      ...tokenProperties,
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      labelKey: MONEY_START_EARNING_LABEL_KEY,
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    deposit();
  }, [deposit, tokenProperties, trackTokenButtonClicked]);

  const onProjectionTooltipOpen = useCallback(() => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.EarnOnYourCrypto,
      tooltipType: MoneyTooltipType.Info,
    });
  }, [trackTooltipClicked]);

  const display = useMemo(
    () =>
      isEligible &&
      apyPercent !== undefined &&
      apyPercentFormatted !== undefined &&
      projectedEarningsFormatted !== undefined
        ? { apyPercent, apyPercentFormatted, projectedEarningsFormatted }
        : undefined,
    [apyPercent, apyPercentFormatted, isEligible, projectedEarningsFormatted],
  );

  useTrackOnce(display !== undefined, trackComponentViewed);

  return { display, onStartEarning, onProjectionTooltipOpen };
}
