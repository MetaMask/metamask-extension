import React, { useCallback, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  BadgeWrapperPosition,
  BadgeWrapperPositionAnchorShape,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
} from '@metamask/design-system-react';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { AccountName } from '../../../components/app/transaction/account-name';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import { getImageForChainId } from '../../../selectors/multichain';
import RampsTokenSelectionHeader from '../token-selection/components/ramps-token-selection-header';
import type { RampsCompleteBuyLocationState } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isCompleteBuyState(
  state: unknown,
): state is RampsCompleteBuyLocationState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const candidate = state as Partial<RampsCompleteBuyLocationState>;
  return (
    isNonEmptyString(candidate.checkoutUrl) &&
    isNonEmptyString(candidate.providerName) &&
    isNonEmptyString(candidate.tokenSymbol) &&
    isNonEmptyString(candidate.walletAddress) &&
    typeof candidate.createdAt === 'number' &&
    Number.isFinite(candidate.createdAt)
  );
}

export default function RampsCompleteBuyScreen() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatDateTime, formatToken } = useFormatters();
  useRampsScreenViewed('Complete Buy', { waitForRegion: false });

  const state = isCompleteBuyState(location.state) ? location.state : null;

  const handleBackToWallet = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  if (!state) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const estimatedReceive =
    state.amountOut !== undefined &&
    state.amountOut !== null &&
    state.tokenSymbol
      ? formatToken(Number(state.amountOut), state.tokenSymbol, {
          maximumFractionDigits: 6,
          minimumFractionDigits: 0,
        })
      : undefined;

  const networkImageUrl = state.tokenChainId
    ? getImageForChainId(state.tokenChainId)
    : undefined;

  const detailRows: { label: string; value: ReactNode; testId: string }[] = [
    {
      label: t('date'),
      value: formatDateTime(state.createdAt),
      testId: 'ramps-complete-buy-date',
    },
    {
      label: t('rampsEstimatedToReceive'),
      value: estimatedReceive,
      testId: 'ramps-complete-buy-estimated-receive',
    },
    {
      label: t('rampsPaymentMethod'),
      value: state.providerName,
      testId: 'ramps-complete-buy-payment-method',
    },
    {
      label: t('account'),
      value: <AccountName address={state.walletAddress} />,
      testId: 'ramps-complete-buy-account',
    },
  ];

  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid="ramps-complete-buy-screen"
    >
      <RampsTokenSelectionHeader
        title={t('rampsCompleteBuyTitle')}
        onBack={handleBackToWallet}
        backButtonTestId="ramps-complete-buy-back"
      />

      <Box
        className="flex flex-1 flex-col px-4 pb-4"
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Between}
      >
        <Box
          className="flex w-full flex-col gap-4 pt-2"
          flexDirection={BoxFlexDirection.Column}
        >
          <Box
            className="my-2 w-full"
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
          >
            <BadgeWrapper
              position={BadgeWrapperPosition.BottomRight}
              positionAnchorShape={BadgeWrapperPositionAnchorShape.Circular}
              badgeContainerProps={{
                color: BackgroundColor.backgroundDefault,
              }}
              badge={
                networkImageUrl ? (
                  <AvatarNetwork
                    name={state.tokenSymbol}
                    src={networkImageUrl}
                    style={{
                      width: 24,
                      height: 24,
                      borderWidth: 2,
                    }}
                    hasBorder
                  />
                ) : null
              }
            >
              <AvatarToken
                name={state.tokenSymbol}
                src={
                  isNonEmptyString(state.tokenIconUrl)
                    ? state.tokenIconUrl
                    : undefined
                }
                size={AvatarTokenSize.Xl}
                data-testid="ramps-complete-buy-token-avatar"
              />
            </BadgeWrapper>
          </Box>

          <BannerAlert
            severity={BannerAlertSeverity.Info}
            title={t('rampsContinueInBrowser')}
            description={t('rampsCompletePurchaseInProviderTab', [
              state.providerName,
            ])}
            data-testid="ramps-complete-buy-banner"
            className="w-full"
          />

          <Box
            className="flex w-full flex-col gap-2 py-2"
            flexDirection={BoxFlexDirection.Column}
          >
            {detailRows.map(({ label, value, testId }) => {
              if (value === undefined || value === null || value === '') {
                return null;
              }

              return (
                <Box
                  key={testId}
                  className="flex min-h-8 w-full items-center justify-between gap-4"
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  justifyContent={BoxJustifyContent.Between}
                  data-testid={testId}
                >
                  <Text className="text-alternative">{label}</Text>
                  <Box className="min-w-0 break-words text-end">{value}</Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          className="mt-auto flex flex-col gap-4 pt-4"
          flexDirection={BoxFlexDirection.Column}
        >
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={handleBackToWallet}
            data-testid="ramps-complete-buy-back-to-wallet"
          >
            {t('rampsBackToWallet')}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
