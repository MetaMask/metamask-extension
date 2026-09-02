import React, { useCallback } from 'react';
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
} from '@metamask/design-system-react';
import { BackgroundColor } from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { AccountName } from '../../../components/app/transaction/account-name';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useRampsScreenViewed } from '../../../hooks/ramps/useRampsScreenViewed';
import { getImageForChainId } from '../../../selectors/multichain';
import RampsTokenSelectionHeader from '../token-selection/components/ramps-token-selection-header';
import { Footer, Row, Section } from './complete-buy-layout';
import type { RampsCompleteBuyLocationState } from './types';

function isCompleteBuyState(
  state: unknown,
): state is RampsCompleteBuyLocationState {
  if (!state || typeof state !== 'object') {
    return false;
  }

  const candidate = state as Partial<RampsCompleteBuyLocationState>;
  return (
    typeof candidate.checkoutUrl === 'string' &&
    candidate.checkoutUrl.length > 0 &&
    typeof candidate.providerName === 'string' &&
    typeof candidate.tokenSymbol === 'string' &&
    typeof candidate.paymentMethodLabel === 'string' &&
    typeof candidate.walletAddress === 'string' &&
    typeof candidate.createdAt === 'number'
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

  const handleGoToProvider = useCallback(() => {
    if (!state?.checkoutUrl) {
      return;
    }
    global.platform.openTab({ url: state.checkoutUrl });
  }, [state]);

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

  const hexChainId = getMaybeHexChainId(state.tokenChainId);
  const networkImageUrl = hexChainId
    ? getImageForChainId(hexChainId)
    : undefined;

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
          className="flex flex-col gap-4 pt-2"
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
        >
          <BadgeWrapper
            className="my-2"
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
              src={state.tokenIconUrl ?? ''}
              size={AvatarTokenSize.Xl}
              data-testid="ramps-complete-buy-token-avatar"
            />
          </BadgeWrapper>

          <BannerAlert
            severity={BannerAlertSeverity.Info}
            title={t('rampsContinueInBrowser')}
            description={t('rampsCompletePurchaseInProviderTab', [
              state.providerName,
            ])}
            data-testid="ramps-complete-buy-banner"
            className="w-full"
          />

          <Section>
            <Row
              label={t('date')}
              value={formatDateTime(state.createdAt)}
              testId="ramps-complete-buy-date"
            />
            <Row
              label={t('rampsEstimatedToReceive')}
              value={estimatedReceive}
              testId="ramps-complete-buy-estimated-receive"
            />
            <Row
              label={t('paidWith')}
              value={state.paymentMethodLabel}
              testId="ramps-complete-buy-paid-with"
            />
            <Row
              label={t('account')}
              value={<AccountName address={state.walletAddress} />}
              testId="ramps-complete-buy-account"
            />
          </Section>
        </Box>

        <Footer>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={handleGoToProvider}
            data-testid="ramps-complete-buy-go-to-provider"
          >
            {t('rampsGoToProvider', [state.providerName])}
          </Button>
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={handleBackToWallet}
            data-testid="ramps-complete-buy-back-to-wallet"
          >
            {t('rampsBackToWallet')}
          </Button>
        </Footer>
      </Box>
    </Box>
  );
}
