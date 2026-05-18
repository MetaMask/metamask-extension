import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import {
  selectPerpsIsTestnet,
  selectPerpsTradeConfigurations,
} from '../../selectors/perps-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  usePerpsLiveAccount,
  usePerpsLiveMarketData,
  usePerpsLiveOrders,
  usePerpsLivePositions,
} from '../../hooks/perps/stream';
import { getTradeableBalance } from '../../hooks/perps/getTradeableBalance';
import { usePerpsEligibility } from '../../hooks/perps';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  formStateToOrderParams,
  type OrderFormState,
} from '../../components/app/perps/order-entry';
import { usePerpsToast } from '../../components/app/perps';
import { PERPS_TOAST_KEYS } from '../../components/app/perps/perps-toast';
import { safeDecodeURIComponent } from '../../components/app/perps/utils';
import { translatePerpsError } from '../../components/app/perps/utils/translate-perps-error';
import type {
  Order,
  PerpsBackgroundResult,
  Position,
} from '../../components/app/perps/types';
import {
  findExpandedPositionForSymbol,
  findMarketBySymbol,
  getExpandedInitialLeverage,
  getExpandedMaxLeverage,
  parseMarketPrice,
  PerpsMarketExpandedBottomPanel,
  PerpsMarketExpandedChartPanel,
  PerpsMarketExpandedHeader,
  PerpsMarketExpandedModals,
  PerpsMarketExpandedSkeleton,
  PerpsMarketExpandedTradeSection,
} from '../../components/app/perps/perps-market-expanded';

/**
 * Full-width perps trading terminal for browser fullscreen view.
 */
const PerpsMarketExpandedPage: React.FC = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const tradeConfigurations = useSelector(selectPerpsTradeConfigurations);
  const { isEligible } = usePerpsEligibility();
  const { replacePerpsToastByKey } = usePerpsToast();
  const { symbol } = useParams<{ symbol: string }>();

  const decodedSymbol = useMemo(
    () => (symbol ? safeDecodeURIComponent(symbol) : undefined),
    [symbol],
  );

  const { positions } = usePerpsLivePositions();
  const { orders } = usePerpsLiveOrders();
  const { account } = usePerpsLiveAccount();
  const { markets, isInitialLoading: marketsLoading } =
    usePerpsLiveMarketData();

  const market = useMemo(
    () => findMarketBySymbol(markets, decodedSymbol),
    [decodedSymbol, markets],
  );
  const activePosition = useMemo(
    () => findExpandedPositionForSymbol(positions, decodedSymbol),
    [decodedSymbol, positions],
  );
  const marketPrice = useMemo(() => parseMarketPrice(market?.price), [market]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const resolvedCurrentPrice = currentPrice > 0 ? currentPrice : marketPrice;
  const [isOrderPending, setIsOrderPending] = useState(false);
  const [isGeoBlockModalOpen, setIsGeoBlockModalOpen] = useState(false);
  const [closePositionTarget, setClosePositionTarget] =
    useState<Position | null>(null);
  const [reversePositionTarget, setReversePositionTarget] =
    useState<Position | null>(null);
  const [tpslPositionTarget, setTpslPositionTarget] = useState<Position | null>(
    null,
  );
  const [marginPositionTarget, setMarginPositionTarget] =
    useState<Position | null>(null);
  const [cancelOrderTarget, setCancelOrderTarget] = useState<Order | null>(
    null,
  );

  const maxLeverage = useMemo(() => getExpandedMaxLeverage(market), [market]);
  const initialLeverage = useMemo(
    () =>
      getExpandedInitialLeverage({
        symbol: decodedSymbol,
        isTestnet,
        maxLeverage,
        tradeConfigurations,
      }),
    [decodedSymbol, isTestnet, maxLeverage, tradeConfigurations],
  );
  const availableBalance = account
    ? Number.parseFloat(getTradeableBalance(account))
    : 0;

  const openGeoBlockModal = useCallback(() => {
    setIsGeoBlockModalOpen(true);
  }, []);

  const guardPositionAction = useCallback(
    (action: () => void) => {
      if (!isEligible) {
        openGeoBlockModal();
        return;
      }
      action();
    },
    [isEligible, openGeoBlockModal],
  );

  const handleOpenTPSLModal = useCallback(
    (position: Position) => {
      guardPositionAction(() => setTpslPositionTarget(position));
    },
    [guardPositionAction],
  );

  const handleOpenAddMarginModal = useCallback(
    (position: Position) => {
      guardPositionAction(() => setMarginPositionTarget(position));
    },
    [guardPositionAction],
  );

  const handleOpenReverseModal = useCallback(
    (position: Position) => {
      guardPositionAction(() => setReversePositionTarget(position));
    },
    [guardPositionAction],
  );

  const handleOpenCloseModal = useCallback(
    (position: Position) => {
      guardPositionAction(() => setClosePositionTarget(position));
    },
    [guardPositionAction],
  );

  const handleOrderClick = useCallback(
    (order: Order) => {
      guardPositionAction(() => setCancelOrderTarget(order));
    },
    [guardPositionAction],
  );

  const handleOrderSubmit = useCallback(
    async (formState: OrderFormState) => {
      if (!isEligible) {
        openGeoBlockModal();
        return;
      }
      if (!selectedAddress || resolvedCurrentPrice <= 0) {
        return;
      }

      setIsOrderPending(true);
      replacePerpsToastByKey({ key: PERPS_TOAST_KEYS.SUBMIT_IN_PROGRESS });

      try {
        const result = await submitRequestToBackground<PerpsBackgroundResult>(
          'perpsPlaceOrder',
          [formStateToOrderParams(formState, resolvedCurrentPrice)],
        );

        if (!result.success) {
          throw new Error(result.error ?? 'Order failed');
        }

        submitRequestToBackground('perpsSaveTradeConfiguration', [
          formState.asset,
          formState.leverage,
        ]).catch(() => undefined);

        const successToastKey =
          formState.type === 'limit'
            ? PERPS_TOAST_KEYS.ORDER_PLACED
            : PERPS_TOAST_KEYS.ORDER_SUBMITTED;

        replacePerpsToastByKey({
          key: successToastKey,
          ...(successToastKey === PERPS_TOAST_KEYS.ORDER_SUBMITTED
            ? { autoHideTime: 3000 }
            : {}),
        });
      } catch (error) {
        replacePerpsToastByKey({
          key: PERPS_TOAST_KEYS.ORDER_FAILED,
          description:
            translatePerpsError(error, t as (key: string) => string) ??
            t('perpsToastOrderFailedDescriptionFallback'),
        });
      } finally {
        setIsOrderPending(false);
      }
    },
    [
      isEligible,
      openGeoBlockModal,
      replacePerpsToastByKey,
      resolvedCurrentPrice,
      selectedAddress,
      t,
    ],
  );

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  if (!decodedSymbol) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  if (marketsLoading) {
    return <PerpsMarketExpandedSkeleton />;
  }

  if (!market) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="h-screen"
        gap={4}
      >
        <Text variant={TextVariant.HeadingMd}>{t('perpsMarketNotFound')}</Text>
        <Button
          variant={ButtonVariant.Tertiary}
          size={ButtonSize.Sm}
          onClick={() =>
            navigate({ pathname: DEFAULT_ROUTE, search: 'tab=perps' })
          }
        >
          {t('back')}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-screen w-full overflow-hidden bg-background-default"
      data-testid="perps-market-expanded-page"
    >
      <PerpsMarketExpandedHeader
        markets={markets}
        market={market}
        currentSymbol={decodedSymbol}
        chartCurrentPrice={resolvedCurrentPrice}
      />

      <div
        className="grid min-h-0 flex-1 overflow-hidden max-[980px]:overflow-y-auto"
        style={{
          gridTemplateColumns:
            'minmax(420px, 1fr) minmax(280px, 0.42fr) minmax(320px, 0.5fr)',
        }}
      >
        <PerpsMarketExpandedChartPanel
          symbol={decodedSymbol}
          marketPrice={marketPrice}
          positions={positions}
          onCurrentPriceChange={setCurrentPrice}
        />

        <PerpsMarketExpandedTradeSection
          symbol={decodedSymbol}
          currentPrice={resolvedCurrentPrice}
          maxLeverage={maxLeverage}
          availableBalance={availableBalance}
          initialLeverage={initialLeverage}
          isPending={isOrderPending}
          isEligible={isEligible}
          activePosition={activePosition}
          onGeoBlocked={openGeoBlockModal}
          onSubmit={handleOrderSubmit}
          onPositionReverse={handleOpenReverseModal}
          onPositionClose={handleOpenCloseModal}
        />
      </div>

      <PerpsMarketExpandedBottomPanel
        positions={positions}
        orders={orders}
        onPositionTPSL={handleOpenTPSLModal}
        onPositionAddMargin={handleOpenAddMarginModal}
        onPositionReverse={handleOpenReverseModal}
        onPositionClose={handleOpenCloseModal}
        onOrderClick={handleOrderClick}
      />

      <PerpsMarketExpandedModals
        account={account}
        selectedAddress={selectedAddress}
        currentPrice={resolvedCurrentPrice}
        decodedSymbol={decodedSymbol}
        markets={markets}
        marginPositionTarget={marginPositionTarget}
        reversePositionTarget={reversePositionTarget}
        tpslPositionTarget={tpslPositionTarget}
        closePositionTarget={closePositionTarget}
        cancelOrderTarget={cancelOrderTarget}
        isGeoBlockModalOpen={isGeoBlockModalOpen}
        onMarginPositionClose={() => setMarginPositionTarget(null)}
        onReversePositionClose={() => setReversePositionTarget(null)}
        onTPSLPositionClose={() => setTpslPositionTarget(null)}
        onClosePositionClose={() => setClosePositionTarget(null)}
        onCancelOrderClose={() => setCancelOrderTarget(null)}
        onGeoBlockModalClose={() => setIsGeoBlockModalOpen(false)}
      />
    </Box>
  );
};

export default PerpsMarketExpandedPage;
