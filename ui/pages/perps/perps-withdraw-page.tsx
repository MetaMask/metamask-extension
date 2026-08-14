import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  BadgeWrapperPosition,
  BadgeWrapperPositionAnchorShape,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  IconColor,
  IconName,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type {
  AccountState,
  AssetRoute,
  WithdrawResult,
} from '@metamask/perps-controller';
import {
  HYPERLIQUID_ASSET_CONFIGS,
  HYPERLIQUID_WITHDRAWAL_MINUTES,
  WITHDRAWAL_CONSTANTS,
} from '@metamask/perps-controller';
import { isValidPerpsWithdrawAmount } from '../../components/app/perps/constants';
import { Content, Footer, Page } from '../../components/multichain/pages/page';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { FlexDirection } from '../../helpers/constants/design-system';
import { getAvatarNetworkColor } from '../../helpers/utils/accounts';
import {
  CHAIN_IDS,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import { ConfirmInfoRowSize } from '../../components/app/confirm/info/row/row';
import { PerpsFiatHeroAmountInput } from '../../components/app/perps/perps-fiat-hero-amount-input';
import { PerpsFiatSummaryRows } from '../../components/app/perps/perps-fiat-summary-rows';
import { PerpsWithdrawPercentageButtons } from '../../components/app/perps/perps-withdraw-percentage-buttons';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { selectPerpsIsTestnet } from '../../selectors/perps-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import { usePerpsEventTracking } from '../../hooks/perps';
import { getTradeableBalance } from '../../hooks/perps/getTradeableBalance';
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
  PERPS_EXTENSION_EVENT_PROPERTY,
} from '../../../shared/constants/perps-events';
import { translatePerpsError } from '../../components/app/perps/utils/translate-perps-error';
import { formatAmountInputFromNumber } from './perps-withdraw-amount-format';

/** Arbitrum native USDC (matches `ARBITRUM_USDC_TOKEN_OBJECT` in swaps constants). */
const ARBITRUM_USDC_TOKEN_ICON_URL =
  'https://static.cx.metamask.io/api/v1/tokenIcons/42161/0xaf88d065e77c8cc2239327c5edb3a432268e5831.png';

function parsePerpsAmountInput(raw: string): number {
  const normalized = raw.replace(/,/gu, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function countSubAccounts(state: AccountState | null | undefined): number {
  return Object.keys(state?.subAccountBreakdown ?? {}).length;
}

/** `failure_reason` reported when the fresh read blocks a stale-balance withdrawal. */
const STALE_BALANCE_FAILURE_REASON = 'stale_streamed_balance';

/** Rounds the reported shortfall to cents; analytics-only, never displayed. */
const SHORTFALL_CENTS_ROUNDING = 100;

/**
 * Perps withdraw screen: enter USDC amount, validate against routes and balance,
 * submit `perpsWithdraw` with HyperLiquid USDC CAIP asset id.
 *
 * Layout mirrors deposit confirmations (`CustomAmountInfo` + small summary rows).
 * The Perps tab opens this page by default; confirmations-backed withdraw remains
 * gated by the Pay post-quote feature flag.
 */
const PerpsWithdrawPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { account } = usePerpsLiveAccount();
  const { track } = usePerpsEventTracking();

  const [amount, setAmount] = useState('0');
  const [withdrawalRoutes, setWithdrawalRoutes] = useState<AssetRoute[]>([]);
  const [routesError, setRoutesError] = useState<string | null>(null);
  // `fromStaleBalanceGuard` marks the message as derived from one reading of the
  // balance, so a newer reading can retire it. Everything else — a provider
  // rejection, a thrown withdrawal, no account selected — is about the attempt
  // itself and outlives any balance change: on this page that message is the
  // only feedback such a failure has.
  const [submitError, setSubmitError] = useState<{
    message: string;
    fromStaleBalanceGuard: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [freshBalance, setFreshBalance] = useState<{
    streamRevision: number;
    available: number;
  } | null>(null);

  // Parsed with the same function as the fresh read below so both sides of the
  // comparison share one failure mode; an unparseable streamed balance falls
  // back to 0 for display, as before.
  const streamedBalance = parsePerpsAmountInput(getTradeableBalance(account));
  const streamedAvailableNum = Number.isFinite(streamedBalance)
    ? streamedBalance
    : 0;

  // Counts distinct streamed readings so an adopted fresh balance can be tied
  // to the exact reading it was taken against. The value itself cannot do this:
  // it cannot distinguish "the stream is still stale" from "the stream moved
  // away and later reported that number again", and re-adopting on the latter
  // re-pins an older, lower figure the user cannot refresh from this page —
  // submit is capped at the pinned balance, and the fresh read only runs from
  // the submit handler.
  const [streamReading, setStreamReading] = useState({
    available: streamedAvailableNum,
    revision: 0,
  });
  if (streamReading.available !== streamedAvailableNum) {
    setStreamReading({
      available: streamedAvailableNum,
      revision: streamReading.revision + 1,
    });
    // A new reading retires the stale-balance guard's verdict along with the
    // adopted balance it was reached against; otherwise that message is a latch
    // and ends up rendered next to a higher balance and an enabled Submit
    // button. Only that message: a withdrawal that actually failed is not about
    // the balance, and clearing it here would leave the failure with no surface
    // at all on the next price tick.
    setSubmitError((current) =>
      current?.fromStaleBalanceGuard ? null : current,
    );
  }
  const streamRevision = streamReading.revision;

  // A fresh account-state read overrides the streamed balance until the stream
  // catches up, so the displayed balance, the percentage buttons, the
  // validation message and the submit guard all agree on one figure instead of
  // rejecting an amount the screen still presents as available.
  const availableNum =
    freshBalance && freshBalance.streamRevision === streamRevision
      ? freshBalance.available
      : streamedAvailableNum;

  const usdcAssetId = useMemo(
    () =>
      isTestnet
        ? HYPERLIQUID_ASSET_CONFIGS.usdc.testnet
        : HYPERLIQUID_ASSET_CONFIGS.usdc.mainnet,
    [isTestnet],
  );

  const usdcRoute = useMemo(() => {
    return (
      withdrawalRoutes.find((r) => r.assetId === usdcAssetId) ??
      withdrawalRoutes[0]
    );
  }, [withdrawalRoutes, usdcAssetId]);

  const minWithdrawAmount = useMemo(() => {
    const fromRoute = usdcRoute?.constraints?.minAmount;
    if (fromRoute !== undefined && fromRoute !== '') {
      return fromRoute;
    }
    return WITHDRAWAL_CONSTANTS.DefaultMinAmount;
  }, [usdcRoute]);

  const minWithdrawNum = parseFloat(minWithdrawAmount) || 0;
  const defaultFee = WITHDRAWAL_CONSTANTS.DefaultFeeAmount;

  const estimatedMinutes =
    usdcRoute?.constraints?.estimatedMinutes ?? HYPERLIQUID_WITHDRAWAL_MINUTES;

  useEffect(() => {
    let cancelled = false;

    submitRequestToBackground<AssetRoute[]>('perpsGetWithdrawalRoutes', [])
      .then((routes) => {
        if (!cancelled) {
          setRoutesError(null);
          setWithdrawalRoutes(Array.isArray(routes) ? routes : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoutesError(t('perpsWithdrawRoutesError'));
          setWithdrawalRoutes([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const amountNum = useMemo(() => parsePerpsAmountInput(amount), [amount]);

  const youReceiveNum = useMemo(() => {
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return NaN;
    }
    return Math.max(0, amountNum - defaultFee);
  }, [amountNum, defaultFee]);

  const validationMessage = useMemo((): string | null => {
    const trimmed = amount.trim();
    if (trimmed === '' || trimmed === '0') {
      return null;
    }
    const normalizedForValidation = trimmed.replace(/,/gu, '.');
    if (!isValidPerpsWithdrawAmount(normalizedForValidation)) {
      return t('perpsWithdrawInvalidAmount');
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      return t('perpsWithdrawInvalidAmount');
    }
    if (amountNum < minWithdrawNum) {
      return t('perpsWithdrawMinNotice', [minWithdrawAmount]);
    }
    if (amountNum > availableNum) {
      return t('perpsWithdrawInsufficient');
    }
    return null;
  }, [amount, amountNum, availableNum, minWithdrawNum, minWithdrawAmount, t]);

  const hasValidInputs =
    isValidPerpsWithdrawAmount(amount.trim().replace(/,/gu, '.')) &&
    Number.isFinite(amountNum) &&
    amountNum >= minWithdrawNum &&
    amountNum <= availableNum;

  const handleHeroAmountChange = useCallback((value: string) => {
    const next = value.replace(/,/gu, '.');
    if (next === '' || isValidPerpsWithdrawAmount(next)) {
      setAmount(next);
    }
    setSubmitError(null);
  }, []);

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      if (percentage === 100) {
        setAmount(formatAmountInputFromNumber(availableNum) || '0');
      } else {
        setAmount(
          formatAmountInputFromNumber((availableNum * percentage) / 100),
        );
      }
      setSubmitError(null);
    },
    [availableNum],
  );

  const handleCancel = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleContinue = useCallback(async () => {
    if (!hasValidInputs || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const cleanAmount = amount.replace(/,/gu, '.').trim();

    if (!selectedAccount?.address) {
      setSubmitError({
        message: t('perpsWithdrawNoAccount'),
        fromStaleBalanceGuard: false,
      });
      setIsSubmitting(false);
      return;
    }

    if (!isValidPerpsWithdrawAmount(cleanAmount)) {
      setSubmitError({
        message: t('perpsWithdrawInvalidAmount'),
        fromStaleBalanceGuard: false,
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // The balance above comes from the account WebSocket stream, which goes
      // stale whenever the service worker suspends. HyperLiquid re-checks the
      // amount against a freshly fetched account state, so submitting a stale
      // max is the main source of `Insufficient balance` withdrawal failures.
      // Re-read the balance first and stop here rather than submitting a
      // withdrawal that cannot succeed. Fails open: a refresh error leaves the
      // submit path untouched.
      const freshAccountState = await submitRequestToBackground<
        AccountState | undefined
      >('perpsGetAccountState', []).catch(() => undefined);

      // The read only throws when every sub-account (HIP-3 dex) read fails; a
      // partial failure resolves with the surviving ones and an under-reported
      // total, which would block a withdrawal HyperLiquid accepts. Fail open
      // there too. Sub-account keys are named differently by the stream and by
      // this read, so completeness is compared by count.
      //
      // KNOWN GAP: this only covers the perps leg. `getAccountState` fans out
      // over three reads — spot, per-dex perps, and the HL abstraction mode —
      // and only the perps leg affects the sub-account count. If the spot or
      // abstraction read fails transiently, the call still resolves and this
      // check still says "complete", but `addSpotBalanceToAccountState` folds
      // in no free spot USDC (it returns early on `spotBalance === 0`, and
      // fold is disabled while the mode is unresolved). A Unified-mode user
      // with free spot then sees a fresh figure below the streamed one and can
      // be blocked from a withdrawal HyperLiquid would accept. It self-heals on
      // the next stream tick, which releases the adopted balance. It is not
      // detectable here: `AccountState` exposes no read-completeness signal and
      // no spot component to compare against, so the real fix belongs in the
      // controller — see the TAT-3490 report for why a second confirming read
      // was rejected as a workaround.
      const isPartialRead =
        countSubAccounts(freshAccountState) < countSubAccounts(account);
      const freshAvailableNum = parsePerpsAmountInput(
        getTradeableBalance(freshAccountState),
      );
      const requestedNum = parsePerpsAmountInput(cleanAmount);

      const hasUsableFreshRead =
        Boolean(freshAccountState) &&
        !isPartialRead &&
        Number.isFinite(freshAvailableNum);

      // A read that cannot move `availableNum` is not worth a state write.
      const isFreshReadRedundant = freshBalance
        ? freshBalance.streamRevision === streamRevision &&
          freshBalance.available === freshAvailableNum
        : freshAvailableNum === streamedAvailableNum;

      if (hasUsableFreshRead && !isFreshReadRedundant) {
        // Adopting the fresh figure surfaces the insufficient-balance message
        // through the normal validation path and re-arms Max against the real
        // balance, so the block is actionable instead of contradicting the
        // screen. Adopted on every usable read, not only the blocking one, so a
        // balance that recovers while the stream stays stale is not left pinned
        // to the earlier, lower figure.
        setFreshBalance({
          streamRevision,
          available: freshAvailableNum,
        });
      }

      if (hasUsableFreshRead && freshAvailableNum < requestedNum) {
        // Say the submit stopped, rather than relying on the adopted balance to
        // surface it through `validationMessage`: the adoption is keyed on the
        // stream revision captured when the click started, so a balance pushed
        // while this read was in flight leaves it inert — and waking the service
        // worker to run this read is itself a common trigger for such a push.
        // Without this the button would just re-enable and the click would look
        // like it did nothing.
        //
        // Deliberately the generic "could not be completed" rather than
        // `perpsWithdrawInsufficient`: this message outlives the reading it came
        // from, and once the stream catches up with a funded balance a latched
        // "Amount exceeds your available Perps balance" would sit next to a
        // higher balance and an enabled button. The precise message is left to
        // `validationMessage`, which is derived from the current figure and so
        // clears itself.
        setSubmitError({
          message: t('perpsWithdrawFailed'),
          fromStaleBalanceGuard: true,
        });
        // The guard is the fix for the ticket's largest withdraw bucket and
        // returns before `perpsWithdraw`, so the controller emits nothing for
        // it — report it here or prevented failures silently leave the funnel.
        track(MetaMetricsEventName.PerpsError, {
          [PERPS_EVENT_PROPERTY.ERROR_TYPE]:
            PERPS_EVENT_VALUE.ERROR_TYPE.VALIDATION,
          [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]:
            PERPS_EVENT_VALUE.ERROR_MESSAGE_KEY.INSUFFICIENT_BALANCE,
          [PERPS_EVENT_PROPERTY.FAILURE_REASON]: STALE_BALANCE_FAILURE_REASON,
          [PERPS_EVENT_PROPERTY.SIZE]: cleanAmount,
          // Measured against the figure the block was actually decided on, not
          // the streamed one: once an earlier read has been adopted,
          // `availableNum` is that adopted figure, and subtracting from the
          // streamed value there reports a negative "shortfall".
          [PERPS_EXTENSION_EVENT_PROPERTY.STALE_BALANCE_SHORTFALL]:
            Math.round(
              (availableNum - freshAvailableNum) * SHORTFALL_CENTS_ROUNDING,
            ) / SHORTFALL_CENTS_ROUNDING,
        });
        return;
      }

      const result = await submitRequestToBackground<WithdrawResult>(
        'perpsWithdraw',
        [{ amount: cleanAmount, assetId: usdcAssetId }],
      );

      if (result?.success) {
        navigate(DEFAULT_ROUTE);
        return;
      }

      const failedMessage = result?.error ?? t('perpsWithdrawFailed');
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: failedMessage,
      });
      setSubmitError({
        message: result?.error
          ? (translatePerpsError(
              new Error(result.error),
              t as (key: string) => string,
            ) ?? t('perpsWithdrawFailed'))
          : t('perpsWithdrawFailed'),
        fromStaleBalanceGuard: false,
      });
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
      setSubmitError({
        message:
          translatePerpsError(error, t as (key: string) => string) ??
          t('perpsWithdrawFailed'),
        fromStaleBalanceGuard: false,
      });
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    account,
    amount,
    availableNum,
    freshBalance,
    hasValidInputs,
    isSubmitting,
    navigate,
    selectedAccount?.address,
    streamRevision,
    streamedAvailableNum,
    t,
    track,
    usdcAssetId,
  ]);

  const arbitrumNetworkName =
    NETWORK_TO_NAME_MAP[
      CHAIN_IDS.ARBITRUM as keyof typeof NETWORK_TO_NAME_MAP
    ] ?? 'Arbitrum';
  const arbitrumNetworkImageUrl =
    CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
      CHAIN_IDS.ARBITRUM as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
    ] ?? '';

  const receiveAssetRowContent = useMemo(() => {
    const networkBackgroundKey = getAvatarNetworkColor(arbitrumNetworkName);
    const networkAvatarStyle = networkBackgroundKey
      ? {
          backgroundColor: `var(--color-network-${networkBackgroundKey}-default)`,
        }
      : undefined;

    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={2}
        data-testid="perps-withdraw-summary-asset-value"
      >
        <BadgeWrapper
          position={BadgeWrapperPosition.BottomRight}
          positionAnchorShape={BadgeWrapperPositionAnchorShape.Rectangular}
          badge={
            <AvatarNetwork
              src={arbitrumNetworkImageUrl}
              name={arbitrumNetworkName}
              size={AvatarNetworkSize.Xs}
              className="box-border border-2 border-default"
              style={networkAvatarStyle}
            />
          }
        >
          <AvatarToken
            name="USDC"
            src={ARBITRUM_USDC_TOKEN_ICON_URL}
            size={AvatarTokenSize.Sm}
          />
        </BadgeWrapper>
        <Text variant={TextVariant.BodyMd} color={TextColor.TextDefault}>
          USDC
        </Text>
      </Box>
    );
  }, [arbitrumNetworkImageUrl, arbitrumNetworkName]);

  const summaryRows = useMemo(
    () => [
      {
        label: t('perpsWithdrawReceive'),
        valueContent: receiveAssetRowContent,
        'data-testid': 'perps-withdraw-summary-asset',
      },
      {
        label: t('perpsWithdrawFee'),
        value: formatCurrency(defaultFee, 'USD'),
        'data-testid': 'perps-withdraw-summary-fee',
      },
      {
        label: t('perpsWithdrawEstimatedTime'),
        value: t('perpsWithdrawMinutesApprox', [estimatedMinutes]),
        'data-testid': 'perps-withdraw-summary-time',
      },
      {
        label: t('perpsYouReceive'),
        value: Number.isFinite(youReceiveNum)
          ? formatCurrency(youReceiveNum, 'USD')
          : '—',
        emphasizeValue: true,
        valueColor: TextColor.TextDefault,
        'data-testid': 'perps-withdraw-summary-receive',
      },
    ],
    [
      defaultFee,
      estimatedMinutes,
      formatCurrency,
      receiveAssetRowContent,
      t,
      youReceiveNum,
    ],
  );

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const amountHasAlert = Boolean(validationMessage);

  return (
    <Page data-testid="perps-withdraw-page">
      <Box
        alignItems={BoxAlignItems.Center}
        className="bg-background-default"
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.Between}
        paddingLeft={3}
        paddingRight={3}
        paddingTop={4}
        paddingBottom={4}
      >
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          size={ButtonIconSize.Md}
          onClick={handleCancel}
          color={IconColor.IconDefault}
          data-testid="perps-withdraw-back-button"
        />
        <Text
          variant={TextVariant.HeadingSm}
          data-testid="perps-withdraw-header-title"
        >
          {t('perpsWithdrawFundsTitle')}
        </Text>
        <Box style={{ width: 32 }} />
      </Box>
      <Content className="min-h-0 flex-1">
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          className="w-full min-h-0 flex-1"
          style={{ flex: 1, minHeight: 0 }}
        >
          <Box
            flexDirection={BoxFlexDirection.Column}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            gap={4}
            className="w-full min-h-0 flex-1"
            style={{ flex: 1, minHeight: 0 }}
          >
            <PerpsFiatHeroAmountInput
              autoFocus
              value={amount}
              onChange={handleHeroAmountChange}
              disabled={isSubmitting}
              hasAlert={amountHasAlert}
            />

            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
              textAlign={TextAlign.Center}
            >
              {t('perpsAvailableBalance')}
              {formatCurrency(availableNum, 'USD')}
            </Text>

            <PerpsWithdrawPercentageButtons
              disabled={isSubmitting}
              onPercentageClick={handlePercentageClick}
            />
          </Box>

          <Box
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            style={{ flexShrink: 0 }}
          >
            <PerpsFiatSummaryRows
              rows={summaryRows}
              rowVariant={ConfirmInfoRowSize.Small}
            />

            {/* Polite, not assertive: this line re-derives as the user types
                (invalid → below minimum → exceeds balance), and an assertive
                region would interrupt a screen reader mid-word on each change.
                The submit error below is a discrete result, so it stays
                assertive.

                The region stays mounted and only its contents are conditional:
                a live region inserted together with its text is commonly missed
                by assistive tech, which watches regions already present in the
                accessibility tree for changes. */}
            <Box aria-live="polite">
              {validationMessage ? (
                <Box data-testid="perps-withdraw-validation-error">
                  <Text
                    variant={TextVariant.BodySm}
                    color={TextColor.ErrorDefault}
                  >
                    {validationMessage}
                  </Text>
                </Box>
              ) : null}
            </Box>

            {/* One line, not two: when the amount is invalid against the
                current balance that message is the more specific one. */}
            {submitError && !validationMessage ? (
              <Box role="alert" data-testid="perps-withdraw-submit-error">
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.ErrorDefault}
                >
                  {submitError.message}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Content>
      <Footer
        className="confirm-footer_page-footer"
        flexDirection={FlexDirection.Column}
      >
        <Box flexDirection={BoxFlexDirection.Row} gap={4} className="w-full">
          <Button
            isFullWidth
            data-testid="perps-withdraw-cancel"
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={handleCancel}
          >
            {t('cancel')}
          </Button>
          <Button
            isFullWidth
            data-testid="perps-withdraw-submit"
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={handleContinue}
            isLoading={isSubmitting}
            isDisabled={!hasValidInputs || isSubmitting}
          >
            {t('perpsWithdraw')}
          </Button>
        </Box>
      </Footer>
    </Page>
  );
};

export default PerpsWithdrawPage;
