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
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection, TokensSection } from '../components/sections';
import { Footer, Row, Section } from '../components/shared';

/**
 * Shorten an order id for display, keeping both ends (mobile parity —
 * `providerOrderId` is usually a `<prefix>/orders/<id>` composite, so
 * trailing-only truncation reads as an unhelpful "...w41").
 * @param id - The full order id.
 * @returns The shortened id, or the original id if it's already short.
 */
function shortenOrderId(id: string): string {
  return id.length > 14 ? `${id.slice(0, 6)}...${id.slice(-6)}` : id;
}

function formatOptionalMoneyAmount(
  amount: string | number | undefined,
  currency: string | undefined,
  format: (value: number, currencyCode: string) => string,
): string | null {
  if (!amount || !currency || !Number.isFinite(Number(amount))) {
    return null;
  }
  return format(Number(amount), currency);
}

type RampOrderItem = Extract<
  ActivityListItem,
  { type: 'rampBuy' | 'rampSell' }
>;

const RampOrderPaymentDetails = ({
  paymentDetails,
}: {
  paymentDetails: NonNullable<RampOrderItem['data']['paymentDetails']>;
}) => {
  const t = useI18nContext();

  return (
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
  );
};

const RampOrderFooter = ({ item }: { item: RampOrderItem }) => {
  const t = useI18nContext();
  const { goToBuy } = useRampsNavigation();
  const { token, provider } = item.data;

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
  );
};

export function RampOrderDetails({ item }: { item: RampOrderItem }) {
  const t = useI18nContext();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

  const { fiat, token, provider, statusDescription, paymentDetails } =
    item.data;
  const orderId = item.data.id ? getInternalOrderCode(item.data.id) : undefined;
  const showStatusDescription =
    Boolean(statusDescription) && item.status !== 'success';
  const fiatTotal = formatOptionalMoneyAmount(
    fiat?.amount,
    fiat?.currency,
    formatCurrencyWithMinThreshold,
  );
  const fee = item.data.fees?.[0];
  const feeTotal = formatOptionalMoneyAmount(
    fee?.amount,
    fee?.symbol,
    formatCurrencyWithMinThreshold,
  );

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokensSection tokens={[{ token }]} />
        <MetadataSection
          item={item}
          statusDescription={
            showStatusDescription ? statusDescription : undefined
          }
        />
        <Section>
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
          {feeTotal ? (
            <Row label={t('rampsOrderDetailsFees')} value={feeTotal} />
          ) : null}
          {fiatTotal ? (
            <Row
              label={t('rampsOrderDetailsTotal')}
              testId="transaction-breakdown-value-amount"
              value={fiatTotal}
            />
          ) : null}
        </Section>
        {paymentDetails?.length ? (
          <RampOrderPaymentDetails paymentDetails={paymentDetails} />
        ) : null}
      </div>
      <RampOrderFooter item={item} />
    </div>
  );
}
