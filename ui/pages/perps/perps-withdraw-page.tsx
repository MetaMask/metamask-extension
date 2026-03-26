import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
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
  TextField,
  TextFieldSize,
} from '../../components/component-library';
import { isValidPerpsWithdrawAmount } from '../../components/app/perps/constants';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { selectPerpsIsTestnet } from '../../selectors/perps-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import { usePerpsEligibility } from '../../hooks/perps';
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { submitRequestToBackground } from '../../store/background-connection';

/**
 * Perps withdraw screen: enter USDC amount, validate against routes and balance,
 * submit `perpsWithdraw` with HyperLiquid USDC CAIP asset id.
 */
const PerpsWithdrawPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const selectedAccount = useSelector(getSelectedInternalAccount);
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

  const amountNum = useMemo(() => {
    const clean = amount.replace(/,/gu, '');
    const n = parseFloat(clean);
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

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
    if (!isValidPerpsWithdrawAmount(amount.trim())) {
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
    isValidPerpsWithdrawAmount(amount.trim()) &&
    Number.isFinite(amountNum) &&
    amountNum >= minWithdrawNum &&
    amountNum <= availableNum &&
    isEligible;

  const handleBack = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const handleAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value.replace(/,/gu, '');
      if (next === '' || isValidPerpsWithdrawAmount(next)) {
        setAmount(next);
        setSubmitError(null);
      }
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!hasValidInputs || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const cleanAmount = amount.replace(/,/gu, '').trim();

    if (!selectedAccount?.address) {
      setSubmitError(t('perpsWithdrawNoAccount'));
      setIsSubmitting(false);
      return;
    }

    if (!isValidPerpsWithdrawAmount(cleanAmount)) {
      setSubmitError(t('perpsWithdrawInvalidAmount'));
      setIsSubmitting(false);
      return;
    }

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
    } catch {
      setSubmitError(t('perpsWithdrawFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    amount,
    hasValidInputs,
    isSubmitting,
    navigate,
    selectedAccount?.address,
    t,
    usdcAssetId,
  ]);

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <Page data-testid="perps-withdraw-page">
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
      <Content>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingLeft={4}
          paddingRight={4}
          paddingBottom={4}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('perpsWithdrawDescription')}
          </Text>

          {routesError ? (
            <Text variant={TextVariant.BodySm} color={TextColor.Error}>
              {routesError}
            </Text>
          ) : null}

          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Text fontWeight={FontWeight.Medium}>
              {t('perpsWithdrawAmount')}
            </Text>
            <TextField
              size={TextFieldSize.Md}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={!isEligible || isSubmitting}
              inputProps={{ 'data-testid': 'perps-withdraw-amount-input' }}
            />
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsAvailableBalance')}:{' '}
              {formatCurrency(availableNum, 'USD')}
            </Text>
          </Box>

          <Box flexDirection={BoxFlexDirection.Column} gap={2}>
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text color={TextColor.TextAlternative}>
                {t('perpsWithdrawFee')}
              </Text>
              <Text>{formatCurrency(defaultFee, 'USD')}</Text>
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text color={TextColor.TextAlternative}>
                {t('perpsWithdrawEstimatedTime')}
              </Text>
              <Text>
                {t('perpsWithdrawMinutesApprox', [String(estimatedMinutes)])}
              </Text>
            </Box>
            <Box
              flexDirection={BoxFlexDirection.Row}
              justifyContent={BoxJustifyContent.Between}
              alignItems={BoxAlignItems.Center}
            >
              <Text fontWeight={FontWeight.Medium}>
                {t('perpsYouWillReceive')}
              </Text>
              <Text fontWeight={FontWeight.Medium}>
                {Number.isFinite(youReceiveNum)
                  ? formatCurrency(youReceiveNum, 'USD')
                  : '—'}
              </Text>
            </Box>
          </Box>

          {validationMessage ? (
            <Text variant={TextVariant.BodySm} color={TextColor.Error}>
              {validationMessage}
            </Text>
          ) : null}

          {submitError ? (
            <Text variant={TextVariant.BodySm} color={TextColor.Error}>
              {submitError}
            </Text>
          ) : null}

          {!isEligible ? (
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t('perpsGeoBlockedTooltip')}
            </Text>
          ) : null}

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
      </Content>
    </Page>
  );
};

export default PerpsWithdrawPage;
