import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '@metamask/design-system-react';
import { getInternalOrderCode } from '@metamask/ramps-controller';
import { isCaipAssetType } from '@metamask/utils';
import type { ActivityListItem } from '../../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import useRampsNavigation from '../../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { useRampsOrders } from '../../../../hooks/ramps/useRampsOrders';
import { useRampsScreenViewed } from '../../../../hooks/ramps/useRampsScreenViewed';
import { hasPositiveNumericAmount } from '../../../../hooks/ramps/utils/hasPositiveNumericAmount';
import { BlockExplorerButton } from '../../components/block-explorer-button';
import { Footer, Row, Section } from '../../components/shared';
import { RampMetadataSection } from './ramp-metadata-section';
import { RampTokensSection } from './ramp-tokens-section';

/**
 * Truncates the middle of long order ids for display.
 *
 * @param id - The full order id.
 * @returns The shortened id, or the original when already short.
 */
function shortenOrderId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 6)}...${id.slice(-6)}` : id;
}

export function RampOrderDetails({
  item,
}: {
  item: Extract<ActivityListItem, { type: 'rampBuy' | 'rampSell' }>;
}) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });
  const { goToBuy } = useRampsNavigation();
  const { getOrderById } = useRampsOrders();

  // Reached from the activity list rather than the buy flow, so no region is
  // ever fetched here — fire on mount instead of waiting for one.
  useRampsScreenViewed('Order Details', { waitForRegion: false });

  const { fiat, token, provider, statusDescription, paymentDetails } =
    item.data;
  const rawOrder = item.data.id ? getOrderById(item.data.id) : undefined;
  const orderId = item.data.id ? getInternalOrderCode(item.data.id) : undefined;
  const paidWith =
    rawOrder?.paymentMethod?.name ?? rawOrder?.paymentMethod?.shortName;
  const showStatusDescription =
    Boolean(statusDescription) && item.status !== 'success';
  const fiatTotal =
    fiat?.currency && hasPositiveNumericAmount(fiat.amount)
      ? formatCurrencyWithMinThreshold(Number(fiat.amount), fiat.currency)
      : undefined;
  const fee = item.data.fees?.[0];
  const feeTotal =
    fee?.symbol && hasPositiveNumericAmount(fee.amount)
      ? formatCurrencyWithMinThreshold(Number(fee.amount), fee.symbol)
      : undefined;
  const providerFeeLabel = provider?.name
    ? t('rampsOrderDetailsProviderFee', [provider.name])
    : t('rampsOrderDetailsFees');

  const handleViewOnProvider = () => {
    if (provider?.orderLink) {
      global.platform.openTab({ url: provider.orderLink });
    }
  };

  const handleBuyAgain = () => {
    goToBuy(
      token?.assetId && isCaipAssetType(token.assetId)
        ? { assetId: token.assetId }
        : undefined,
    );
  };

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <RampTokensSection item={item} />
        <RampMetadataSection
          item={item}
          statusDescription={
            showStatusDescription ? statusDescription : undefined
          }
        />
        <Section>
          {paidWith ? (
            <Row label={t('rampsOrderDetailsPaidWith')} value={paidWith} />
          ) : null}
          {orderId ? (
            <Row
              label={t('rampsOrderDetailsOrderId')}
              value={
                <button
                  type="button"
                  onClick={() => handleCopy(orderId)}
                  aria-label={t('copyToClipboard')}
                  className="inline-flex items-center gap-1 rounded-full bg-background-alternative px-2 py-0.5"
                >
                  {shortenOrderId(orderId)}
                  <Icon name={IconName.Copy} size={IconSize.Sm} />
                </button>
              }
            />
          ) : null}
        </Section>
        <Section>
          {feeTotal ? <Row label={providerFeeLabel} value={feeTotal} /> : null}
          {fiatTotal ? (
            <Row
              label={t('rampsOrderDetailsTotal')}
              testId="transaction-breakdown-value-amount"
              value={fiatTotal}
            />
          ) : null}
        </Section>
        {paymentDetails?.length ? (
          <Section>
            <Text className="pb-1 font-medium">
              {t('rampsOrderDetailsBankDetails')}
            </Text>
            {paymentDetails.flatMap((detail) =>
              detail.fields.map((field) => (
                <Row key={field.id} label={field.name} value={field.value} />
              )),
            )}
          </Section>
        ) : null}
      </div>
      <Footer>
        {provider?.orderLink ? (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Secondary}
            onClick={handleViewOnProvider}
          >
            {t('rampsOrderDetailsViewOnProvider', [provider.name ?? ''])}
          </Button>
        ) : null}
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
        {item.type === 'rampBuy' ? (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={handleBuyAgain}
          >
            {t('rampsOrderDetailsBuyAgain')}
          </Button>
        ) : null}
      </Footer>
    </div>
  );
}
