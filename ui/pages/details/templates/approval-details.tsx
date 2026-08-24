import React from 'react';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { getHumanReadableTokenAmount } from '../../../../shared/lib/activity/fiat';
import { useFormatters } from '../../../hooks/useFormatters';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { FeesRows, TotalAmountRow } from '../components/amounts-section';
import { Footer, Section } from '../components/shared';
import { BlockExplorerButton } from '../components/block-explorer-button';
import { MetadataSection } from '../components/sections';
import { TokenHeader } from '../components/token-header';

const maximumFractionDigits = 8;

export function ApprovalDetails({
  item,
}: {
  item: Extract<
    ActivityListItem,
    {
      type: 'approveSpendingCap' | 'revokeSpendingCap' | 'increaseSpendingCap';
    }
  >;
}) {
  const t = useI18nContext();
  const { formatToken } = useFormatters();
  const { token } = item.data;
  const humanAmount = token ? getHumanReadableTokenAmount(token) : undefined;

  let amount: string | undefined;
  if (token) {
    if (item.type === 'revokeSpendingCap') {
      amount = '0';
    } else if (
      token.amount === undefined ||
      token.amount === null ||
      token.amount === ''
    ) {
      amount = t('unlimited');
    } else if (humanAmount !== undefined) {
      amount = formatToken(humanAmount as `${number}`, '', {
        maximumFractionDigits,
      }).trim();
    }
  }

  return (
    <div className="flex grow flex-col">
      <div className="divide-y divide-border-muted">
        <TokenHeader token={token} amount={amount} />
        <MetadataSection item={item} />
        <Section>
          <FeesRows item={item} />
          <TotalAmountRow token={item.data.token} />
        </Section>
      </div>
      <Footer>
        <BlockExplorerButton chainId={item.chainId} txHash={item.hash} />
      </Footer>
    </div>
  );
}
