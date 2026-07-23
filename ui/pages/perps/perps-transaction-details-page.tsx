import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../components/component-library';
import { Content, Header, Page } from '../../components/multichain/pages/page';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useFormatters } from '../../hooks/useFormatters';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { PerpsTokenLogo } from '../../components/app/perps/perps-token-logo';
import { PerpsFillTag } from '../../components/app/perps/perps-fill-tag';
import { getDisplaySymbol } from '../../components/app/perps/utils';
import {
  formatPerpsFiatMinimal,
  formatPerpsFiatUniversal,
} from '../../components/app/perps/utils/formatPerpsDisplayPrice';
import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import { formatPnl } from '../../../shared/lib/perps-formatters';
import type { PerpsTransaction } from '../../components/app/perps/types';
// eslint-disable-next-line import-x/no-restricted-paths
import { Row } from '../details/components/shared';

/**
 * Wraps a signed value (e.g. PnL, funding amount) in the success/error text
 * color used across the app to indicate a positive or negative amount.
 *
 * @param options0 - Component props
 * @param options0.value - The value to render
 * @param options0.isPositive - Whether the value represents a gain (success color) or a loss (error color)
 */
const SignedValue = ({
  value,
  isPositive,
}: {
  value: React.ReactNode;
  isPositive: boolean;
}) => (
  <span className={isPositive ? 'text-success-default' : 'text-error-default'}>
    {value}
  </span>
);

/**
 * Renders the order-specific detail rows (status, type, limit price, order
 * value, filled %) for an `order`-type Perps transaction.
 *
 * @param options0 - Component props
 * @param options0.transaction - The order transaction to render rows for
 * @param options0.t - Translation function
 */
const OrderDetailRows = ({
  transaction,
  t,
}: {
  transaction: PerpsTransaction;
  t: ReturnType<typeof useI18nContext>;
}) => {
  const { order } = transaction;
  if (!order) {
    return null;
  }

  return (
    <>
      <Row
        label={t('perpsOrderStatus')}
        value={order.text || t('perpsStatusOpen')}
      />
      <Row
        label={t('perpsOrderType')}
        value={order.type === 'limit' ? t('perpsLimit') : t('perpsMarket')}
      />
      {order.type === 'limit' && (
        <Row
          label={t('perpsLimitPrice')}
          value={formatPerpsFiatUniversal(order.limitPrice)}
        />
      )}
      <Row
        label={t('perpsOrderValue')}
        value={formatPerpsFiatMinimal(order.size)}
      />
      <Row label={t('perpsOrderFilled')} value={order.filled} />
    </>
  );
};

/**
 * Renders the trade-specific detail rows (entry price, size, P&L, fees) for
 * a `trade`-type Perps transaction (an executed fill).
 *
 * @param options0 - Component props
 * @param options0.transaction - The trade transaction to render rows for
 * @param options0.t - Translation function
 * @param options0.displaySymbol - Human-readable asset symbol
 */
const TradeDetailRows = ({
  transaction,
  t,
  displaySymbol,
}: {
  transaction: PerpsTransaction;
  t: ReturnType<typeof useI18nContext>;
  displaySymbol: string;
}) => {
  const { fill } = transaction;
  if (!fill) {
    return null;
  }

  const pnlNumber = parseFloat(fill.pnl);
  const showPnl =
    transaction.category === 'position_close' &&
    !isNaN(pnlNumber) &&
    pnlNumber !== 0;

  return (
    <>
      <Row
        label={t('perpsEntryPrice')}
        value={formatPerpsFiatUniversal(fill.entryPrice)}
      />
      <Row label={t('perpsSize')} value={`${fill.size} ${displaySymbol}`} />
      {showPnl && (
        <Row
          label={t('perpsPnl')}
          value={
            <SignedValue value={formatPnl(pnlNumber)} isPositive={pnlNumber >= 0} />
          }
        />
      )}
      <Row label={t('perpsFees')} value={formatPerpsFiatMinimal(fill.fee)} />
    </>
  );
};

/**
 * Renders the funding-specific detail rows (rate, amount) for a
 * `funding`-type Perps transaction.
 *
 * @param options0 - Component props
 * @param options0.transaction - The funding transaction to render rows for
 * @param options0.t - Translation function
 */
const FundingDetailRows = ({
  transaction,
  t,
}: {
  transaction: PerpsTransaction;
  t: ReturnType<typeof useI18nContext>;
}) => {
  const { fundingAmount } = transaction;
  if (!fundingAmount) {
    return null;
  }

  return (
    <>
      <Row label={t('perpsFundingRate')} value={fundingAmount.rate} />
      <Row
        label={t('amount')}
        value={
          <SignedValue
            value={fundingAmount.fee}
            isPositive={fundingAmount.isPositive}
          />
        }
      />
    </>
  );
};

/**
 * PerpsTransactionDetailsPage displays details for a single Perps order,
 * trade (fill), or funding payment. The transaction is handed off via
 * router state from the activity list/recent-activity widgets that link
 * here, since these are off-chain Perps events with no generic activity
 * record to refetch by id.
 *
 * Deposits and withdrawals are on-chain transactions and are routed to the
 * existing generic `TX_DETAILS_ROUTE` instead of this page — see
 * `getPerpsTransactionDestination`.
 */
const PerpsTransactionDetailsPage = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isPerpsExperienceAvailable = useSelector(getIsPerpsExperienceAvailable);
  const { formatDateTime } = useFormatters();

  const handleBackClick = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (!isPerpsExperienceAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const state = location.state as { transaction?: PerpsTransaction } | null;
  const transaction = state?.transaction;

  if (!transaction) {
    return (
      <Page data-testid="perps-transaction-details-page">
        <Header
          startAccessory={
            <ButtonIcon
              data-testid="perps-transaction-details-back-button"
              iconName={IconName.ArrowLeft}
              ariaLabel={t('back')}
              size={ButtonIconSize.Md}
              onClick={handleBackClick}
            />
          }
        >
          {t('perpsDetails')}
        </Header>
        <Content>
          <Box
            paddingTop={8}
            paddingBottom={8}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            data-testid="perps-transaction-details-not-found"
          >
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('perpsNoTransactions')}
            </Text>
          </Box>
        </Content>
      </Page>
    );
  }

  const displaySymbol = getDisplaySymbol(transaction.symbol);

  return (
    <Page data-testid="perps-transaction-details-page">
      <Header
        startAccessory={
          <ButtonIcon
            data-testid="perps-transaction-details-back-button"
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            size={ButtonIconSize.Md}
            onClick={handleBackClick}
          />
        }
      >
        {transaction.title}
      </Header>
      <Content>
        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          gap={2}
          paddingBottom={4}
          data-testid="perps-transaction-details-hero"
        >
          <PerpsTokenLogo
            symbol={transaction.symbol}
            size={AvatarTokenSize.Lg}
          />
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
              {displaySymbol}
            </Text>
            <PerpsFillTag
              transaction={transaction}
              screenName={PERPS_EVENT_VALUE.SCREEN_NAME.PERPS_ACTIVITY_HISTORY}
            />
          </Box>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          className="divide-y divide-border-muted"
        >
          <Row
            label={t('perpsOrderDate')}
            value={formatDateTime(transaction.timestamp)}
          />
          {transaction.type === 'order' && (
            <OrderDetailRows transaction={transaction} t={t} />
          )}
          {transaction.type === 'trade' && (
            <TradeDetailRows
              transaction={transaction}
              t={t}
              displaySymbol={displaySymbol}
            />
          )}
          {transaction.type === 'funding' && (
            <FundingDetailRows transaction={transaction} t={t} />
          )}
        </Box>
      </Content>
    </Page>
  );
};

export default PerpsTransactionDetailsPage;
