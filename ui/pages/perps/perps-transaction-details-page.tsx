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

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
  valueColor?: TextColor;
};

/**
 * A single label/value row within a details section. Renders nothing when
 * the value is empty, matching the collapsing behavior used by the generic
 * activity details rows elsewhere in the app.
 *
 * @param options0 - Component props
 * @param options0.label - Row label text
 * @param options0.value - Row value content (hidden entirely when empty)
 * @param options0.valueColor - Optional text color override for the value
 */
const DetailRow = ({ label, value, valueColor }: DetailRowProps) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      paddingTop={2}
      paddingBottom={2}
      data-testid="perps-transaction-details-row"
    >
      <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
        {label}
      </Text>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={valueColor}
      >
        {value}
      </Text>
    </Box>
  );
};

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
      <DetailRow
        label={t('perpsOrderStatus')}
        value={order.text || t('perpsStatusOpen')}
      />
      <DetailRow
        label={t('perpsOrderType')}
        value={order.type === 'limit' ? t('perpsLimit') : t('perpsMarket')}
      />
      {order.type === 'limit' && (
        <DetailRow
          label={t('perpsLimitPrice')}
          value={formatPerpsFiatUniversal(order.limitPrice)}
        />
      )}
      <DetailRow
        label={t('perpsOrderValue')}
        value={formatPerpsFiatMinimal(order.size)}
      />
      <DetailRow label={t('perpsOrderFilled')} value={order.filled} />
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
      <DetailRow
        label={t('perpsEntryPrice')}
        value={formatPerpsFiatUniversal(fill.entryPrice)}
      />
      <DetailRow
        label={t('perpsSize')}
        value={`${fill.size} ${displaySymbol}`}
      />
      {showPnl && (
        <DetailRow
          label={t('perpsPnl')}
          value={formatPnl(pnlNumber)}
          valueColor={
            pnlNumber >= 0 ? TextColor.SuccessDefault : TextColor.ErrorDefault
          }
        />
      )}
      <DetailRow
        label={t('perpsFees')}
        value={formatPerpsFiatMinimal(fill.fee)}
      />
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
      <DetailRow label={t('perpsFundingRate')} value={fundingAmount.rate} />
      <DetailRow
        label={t('amount')}
        value={fundingAmount.fee}
        valueColor={
          fundingAmount.isPositive
            ? TextColor.SuccessDefault
            : TextColor.ErrorDefault
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
          <DetailRow
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
