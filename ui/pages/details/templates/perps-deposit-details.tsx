import React from 'react';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { TransactionStatus as TransactionMetaStatus } from '@metamask/transaction-controller';
import type { ActivityListItem } from '../../../../shared/lib/activity/types';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { usePerpsDepositConfirmation } from '../../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
import {
  ARBITRUM_USDC,
  PERPS_CURRENCY,
  // eslint-disable-next-line import-x/no-restricted-paths
} from '../../confirmations/constants/perps';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFormatters } from '../../../hooks/useFormatters';
import { MmPayDetailsLayout } from './mm-pay-details-layout';

const PERPS_USDC_ASSET_ID = `${toEvmCaipChainId(CHAIN_IDS.ARBITRUM)}/erc20:${ARBITRUM_USDC.address}`;

type Props = {
  item: Extract<
    ActivityListItem,
    { type: 'perpsAddFunds' } | { type: 'perpsWithdraw' }
  >;
};

export function PerpsDepositDetails({ item }: Readonly<Props>) {
  const t = useI18nContext();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const transactionMeta = useLocalTransactionMeta(item.hash);
  const { metamaskPay } = transactionMeta ?? {};
  const { bridgeFeeFiat, networkFeeFiat, targetFiat, totalFiat } =
    metamaskPay || {};

  const formatFiat = (value?: string) =>
    value
      ? formatCurrencyWithMinThreshold(Number(value), PERPS_CURRENCY)
      : null;

  const formattedTargetFiat = formatFiat(targetFiat);

  return (
    <MmPayDetailsLayout
      avatarTokens={[PERPS_USDC_ASSET_ID]}
      feeSectionAlwaysVisible
      footer={
        transactionMeta?.status === TransactionMetaStatus.confirmed ? (
          <Button
            className="w-full"
            size={ButtonSize.Lg}
            variant={ButtonVariant.Primary}
            onClick={() => triggerDeposit()}
          >
            {t('perpsFundAgain')}
          </Button>
        ) : null
      }
      formatFiat={formatFiat}
      heroAmount={formattedTargetFiat ? `+${formattedTargetFiat}` : null}
      item={item}
      metamaskPay={{ bridgeFeeFiat, networkFeeFiat, totalFiat }}
      transactionMeta={transactionMeta}
    />
  );
}
