import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Text,
  TextVariant,
  TextColor,
  Button,
  ButtonVariant,
  ButtonSize,
} from '@metamask/design-system-react';
import type { AssetRoute, WithdrawResult } from '@metamask/perps-controller';
import {
  HYPERLIQUID_ASSET_CONFIGS,
  HYPERLIQUID_WITHDRAWAL_MINUTES,
  WITHDRAWAL_CONSTANTS,
} from '@metamask/perps-controller';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Box,
  Text as ClText,
} from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextAlign,
  TextVariant as ClTextVariant,
  TextColor as ClTextColor,
} from '../../helpers/constants/design-system';
import { ConfirmInfoRowSize } from '../../components/app/confirm/info/row/row';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { PerpsFiatHeroAmountInput } from '../../components/app/perps/perps-fiat-hero-amount-input';
import { PerpsFiatSummaryRows } from '../../components/app/perps/perps-fiat-summary-rows';
import { PerpsWithdrawPercentageButtons } from '../../components/app/perps/perps-withdraw-percentage-buttons';
import { PerpsWalletAccountHeader } from '../../components/app/perps/perps-wallet-account-header';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { selectPerpsIsTestnet } from '../../selectors/perps-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import { usePerpsEligibility } from '../../hooks/perps';
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { submitRequestToBackground } from '../../store/background-connection';

function parsePerpsAmountInput(raw: string): number {
  const normalized = raw.replace(/,/gu, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : NaN;
}

function formatAmountInputFromNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return '';
  }
  const rounded = Math.floor(n * 1e8) / 1e8;
  if (rounded === Math.floor(rounded)) {
    return String(Math.floor(rounded));
  }
  return String(rounded);
}

/**
 * Perps withdraw screen: enter USDC amount, validate against routes and balance,
 * submit `perpsWithdraw` with HyperLiquid USDC CAIP asset id.
 *
 * Layout mirrors deposit confirmations (`CustomAmountInfo` + small summary rows)
 * while remaining a standalone multichain page (no `TransactionMeta` / pay flow).
 */
const PerpsWithdrawPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const { isEligible } = usePerpsEligibility();
  const { account } = usePerpsLiveAccount();

  const [amount, setAmount] = useState('');
  const [withdrawalRoutes, setWithdrawalRoutes] = useState<AssetRoute[]>([]);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = account?.availableBalance ?? '0';
  const availableNum = parseFloat(availableBalance) || 0;

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
    setRoutesError(null);

    submitRequestToBackground<AssetRoute[]>('perpsGetWithdrawalRoutes', [])
      .then((routes) => {
        if (!cancelled) {
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
    if (amount.trim() === '') {
      return null;
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
    Number.isFinite(amountNum) &&
    amountNum >= minWithdrawNum &&
    amountNum <= availableNum &&
    isEligible;

  const handleBack = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleHeroAmountChange = useCallback((value: string) => {
    setAmount(value);
    setSubmitError(null);
  }, []);

  const handlePercentageClick = useCallback(
    (percentage: number) => {
      if (percentage === 100) {
        setAmount(availableBalance);
      } else {
        setAmount(
          formatAmountInputFromNumber((availableNum * percentage) / 100),
        );
      }
      setSubmitError(null);
    },
    [availableBalance, availableNum],
  );

  const handleContinue = useCallback(async () => {
    if (!hasValidInputs || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const cleanAmount = amount.replace(/,/gu, '.');

    try {
      const validation = await submitRequestToBackground<{
        isValid: boolean;
        error?: string;
      }>('perpsValidateWithdrawal', [
        { amount: cleanAmount, assetId: usdcAssetId },
      ]);

      if (!validation?.isValid) {
        setSubmitError(validation?.error ?? t('perpsWithdrawInvalidAmount'));
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

      setSubmitError(result?.error ?? t('perpsWithdrawFailed'));
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
    } catch {
      setSubmitError(t('perpsWithdrawFailed'));
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, hasValidInputs, isSubmitting, navigate, t, usdcAssetId]);

  const summaryRows = useMemo(
    () => [
      {
        label: t('perpsWithdrawFee'),
        value: formatCurrency(defaultFee, 'USD'),
        'data-testid': 'perps-withdraw-summary-fee',
      },
      {
        label: t('perpsWithdrawEstimatedTime'),
        value: t('perpsWithdrawMinutesApprox', [String(estimatedMinutes)]),
        'data-testid': 'perps-withdraw-summary-time',
      },
      {
        label: t('perpsYouWillReceive'),
        value: Number.isFinite(youReceiveNum)
          ? formatCurrency(youReceiveNum, 'USD')
          : '—',
        emphasizeValue: true,
        'data-testid': 'perps-withdraw-summary-receive',
      },
    ],
    [defaultFee, estimatedMinutes, formatCurrency, t, youReceiveNum],
  );

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const amountHasAlert = Boolean(validationMessage);

  return (
    <Page data-testid="perps-withdraw-page">
      <PerpsWalletAccountHeader />
      <Header
        startAccessory={
          <ButtonIcon
            data-testid="perps-withdraw-back-button"
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            size={ButtonIconSize.Md}
            onClick={handleBack}
          />
        }
      >
        {t('perpsWithdrawFunds')}
      </Header>
      <Content className="min-h-0 flex-1">
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          width={BlockSize.Full}
          style={{ flex: 1, minHeight: 0 }}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
            style={{ flexShrink: 0 }}
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsWithdrawDescription')}
            </Text>

            {routesError ? (
              <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
                {routesError}
              </Text>
            ) : null}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
            gap={4}
            width={BlockSize.Full}
            style={{ flex: 1, minHeight: 0 }}
          >
            <PerpsFiatHeroAmountInput
              value={amount}
              onChange={handleHeroAmountChange}
              disabled={!isEligible || isSubmitting}
              hasAlert={amountHasAlert}
            />

            <ClText
              variant={ClTextVariant.bodySm}
              color={ClTextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              {t('perpsAvailableBalance')}:{' '}
              {formatCurrency(availableNum, 'USD')}
            </ClText>

            {isEligible ? (
              <PerpsWithdrawPercentageButtons
                disabled={isSubmitting}
                onPercentageClick={handlePercentageClick}
              />
            ) : null}
          </Box>

          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={4}
            style={{ flexShrink: 0 }}
          >
            <PerpsFiatSummaryRows
              rows={summaryRows}
              rowVariant={ConfirmInfoRowSize.Small}
            />

            {validationMessage ? (
              <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
                {validationMessage}
              </Text>
            ) : null}

            {submitError ? (
              <Text variant={TextVariant.BodySm} color={TextColor.ErrorDefault}>
                {submitError}
              </Text>
            ) : null}

            {isEligible ? null : (
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
              >
                {t('perpsGeoBlockedTooltip')}
              </Text>
            )}

            <Button
              data-testid="perps-withdraw-continue"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              onClick={handleContinue}
              isLoading={isSubmitting}
              disabled={!hasValidInputs || isSubmitting}
            >
              {t('continue')}
            </Button>
          </Box>
        </Box>
      </Content>
    </Page>
  );
};

export default PerpsWithdrawPage;
