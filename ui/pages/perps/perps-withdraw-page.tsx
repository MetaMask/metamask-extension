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
import type { AssetRoute, WithdrawResult } from '@metamask/perps-controller';
import {
  HYPERLIQUID_ASSET_CONFIGS,
  HYPERLIQUID_WITHDRAWAL_MINUTES,
  WITHDRAWAL_CONSTANTS,
} from '@metamask/perps-controller';
import { isValidPerpsWithdrawAmount } from '../../components/app/perps/constants';
import { Content, Footer, Page } from '../../components/multichain/pages/page';
import { getSelectedInternalAccount } from '../../selectors/accounts';
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
import { usePerpsLiveAccount } from '../../hooks/perps/stream';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { submitRequestToBackground } from '../../store/background-connection';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
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
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const { account } = usePerpsLiveAccount();
  const { track } = usePerpsEventTracking();

  const [amount, setAmount] = useState('0');
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
        track(MetaMetricsEventName.PerpsWithdrawalTransaction, {
          [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.SUCCESS,
          [PERPS_EVENT_PROPERTY.SIZE]: cleanAmount,
        });
        navigate(DEFAULT_ROUTE);
        return;
      }

      const failedMessage = result?.error ?? t('perpsWithdrawFailed');
      track(MetaMetricsEventName.PerpsWithdrawalTransaction, {
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
        [PERPS_EVENT_PROPERTY.SIZE]: cleanAmount,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: failedMessage,
      });
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: failedMessage,
      });
      setSubmitError(
        result?.error
          ? (translatePerpsError(
              new Error(result.error),
              t as (key: string) => string,
            ) ?? t('perpsWithdrawFailed'))
          : t('perpsWithdrawFailed'),
      );
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      track(MetaMetricsEventName.PerpsWithdrawalTransaction, {
        [PERPS_EVENT_PROPERTY.STATUS]: PERPS_EVENT_VALUE.STATUS.FAILED,
        [PERPS_EVENT_PROPERTY.SIZE]: cleanAmount,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
      track(MetaMetricsEventName.PerpsError, {
        [PERPS_EVENT_PROPERTY.ERROR_TYPE]: PERPS_EVENT_VALUE.ERROR_TYPE.BACKEND,
        [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: errorMessage,
      });
      setSubmitError(
        translatePerpsError(error, t as (key: string) => string) ??
          t('perpsWithdrawFailed'),
      );
      submitRequestToBackground('perpsClearWithdrawResult', []).catch(() => {
        // Non-blocking cleanup of controller toast state
      });
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
        value: t('perpsWithdrawMinutesApprox', [String(estimatedMinutes)]),
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
