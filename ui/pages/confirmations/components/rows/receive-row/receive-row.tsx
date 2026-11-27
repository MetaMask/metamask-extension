import React, { useCallback, useMemo, useState } from 'react';
import { createFormatters } from '@metamask/client-utils';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import {
  TextColor as DsTextColor,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
import { Box, Text } from '../../../../../components/component-library';
import {
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
  ConfirmInfoRowSkeleton,
} from '../../../../../components/app/confirm/info/row/row';
import { ConfirmInfoRowText } from '../../../../../components/app/confirm/info/row/text';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { DottedTrigger } from '../../dotted-trigger';
import {
  PayChecklistDialog,
  type PayCheckListItem,
} from '../../modals/pay-info-dialogs';
import {
  useIsTransactionPayQuotePending,
  useTransactionPayQuotes,
  useTransactionPayTotals,
} from '../../../hooks/pay/useTransactionPayData';
import { useIsPaidByMetaMask } from '../../../hooks/pay/useIsPaidByMetaMask';
import { useConfirmContext } from '../../../context/confirm';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../../../hooks/useFiatFormatter';

const RECEIVE_INFO_DIALOG_TRANSACTION_TYPES = [
  TransactionType.moneyAccountDeposit,
];

const MONEY_USD_DIALOG_TEST_ID = 'money-usd-dialog';

const { formatCurrency: formatEnUsCurrency } = createFormatters({
  locale: 'en-US',
  currencyDisplay: 'narrowSymbol',
});

const formatUsd = (amount: number) => formatEnUsCurrency(amount, 'usd');

export type ReceiveRowProps = {
  /** The user's input amount in USD / fiat */
  inputAmountUsd: string;
  variant?: ConfirmInfoRowSize;
};

/**
 * Row that displays "You'll receive" for withdrawals and input-based deposits.
 * Withdrawals calculate input minus provider, source-network, target-network,
 * and MetaMask fees. Input-based deposits display the controller's target
 * amount.
 *
 * Mirrors the mobile `ReceiveRow`.
 *
 * @param options0
 * @param options0.inputAmountUsd
 * @param options0.variant
 */
export function ReceiveRow({
  inputAmountUsd,
  variant = ConfirmInfoRowSize.Default,
}: ReceiveRowProps) {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const hasReceiveInfoDialog = hasTransactionType(
    currentConfirmation,
    RECEIVE_INFO_DIALOG_TRANSACTION_TYPES,
  );
  // The fee values from `TransactionPayController` (`provider.usd`,
  // `sourceNetwork.estimate.usd`, etc.) are explicitly USD-denominated, and
  // the input is sourced from the `usd`-currency `useTransactionCustomAmount`
  // path used by Perps Withdraw. Force USD formatting so the displayed
  // currency symbol matches the numerical value even if the user has set a
  // non-USD primary currency.
  const formatLocaleFiat = useFiatFormatter({ overrideCurrency: 'usd' });
  const formatFiat = hasReceiveInfoDialog ? formatUsd : formatLocaleFiat;
  const isLoading = useIsTransactionPayQuotePending();
  const totals = useTransactionPayTotals();
  const quotes = useTransactionPayQuotes();
  const isPaidByMetaMask = useIsPaidByMetaMask();
  const { apyPercentFormatted } = useMoneyVaultApy({
    enabled: hasReceiveInfoDialog,
  });
  const [isUsdDialogOpen, setIsUsdDialogOpen] = useState(false);

  const hasQuotes = Boolean(quotes?.length);

  const receiveUsd = useMemo(() => {
    if (
      !totals ||
      inputAmountUsd === null ||
      inputAmountUsd === undefined ||
      !hasQuotes
    ) {
      return '';
    }

    if (totals.isInputBased === true) {
      return formatFiat(new BigNumber(totals.targetAmount.usd).toNumber());
    }

    const inputUsd = new BigNumber(inputAmountUsd || '0');
    // Same-token Money Account withdraws quote estimated network gas that
    // Monad sponsors. Subtracting it would show $0 received on a tiny send.
    if (isPaidByMetaMask) {
      return formatFiat(
        (inputUsd.gte(0) ? inputUsd : new BigNumber(0)).toNumber(),
      );
    }

    const providerFee = new BigNumber(totals.fees?.provider?.usd ?? 0);
    const sourceNetworkFee = new BigNumber(
      totals.fees?.sourceNetwork?.estimate?.usd ?? 0,
    );
    const targetNetworkFee = new BigNumber(
      totals.fees?.targetNetwork?.usd ?? 0,
    );
    const metaMaskFee = new BigNumber(totals.fees?.metaMask?.usd ?? 0);

    const totalFees = providerFee
      .plus(sourceNetworkFee)
      .plus(targetNetworkFee)
      .plus(metaMaskFee);
    const youReceive = inputUsd.minus(totalFees);

    return formatFiat(
      (youReceive.gte(0) ? youReceive : new BigNumber(0)).toNumber(),
    );
  }, [formatFiat, hasQuotes, inputAmountUsd, isPaidByMetaMask, totals]);

  const openUsdDialog = useCallback(() => setIsUsdDialogOpen(true), []);
  const closeUsdDialog = useCallback(() => setIsUsdDialogOpen(false), []);

  const isSmall = variant === ConfirmInfoRowSize.Small;
  const textVariant = isSmall ? TextVariant.bodyMd : TextVariant.bodyMdMedium;

  if (isLoading) {
    return (
      <Box data-testid="receive-row-skeleton">
        <ConfirmInfoRowSkeleton
          label={t('youllReceive')}
          rowVariant={variant}
        />
      </Box>
    );
  }

  let valueNode: React.ReactNode;
  if (hasReceiveInfoDialog && receiveUsd) {
    valueNode = (
      <DottedTrigger
        text={receiveUsd}
        variant={DsTextVariant.BodyMd}
        color={isSmall ? DsTextColor.TextAlternative : DsTextColor.TextDefault}
        onClick={openUsdDialog}
        data-testid="receive-value"
      />
    );
  } else if (isSmall) {
    valueNode = (
      <Text
        variant={textVariant}
        color={TextColor.textAlternative}
        data-testid="receive-value"
      >
        {receiveUsd}
      </Text>
    );
  } else {
    valueNode = (
      <ConfirmInfoRowText text={receiveUsd} data-testid="receive-value" />
    );
  }

  const apyDisplay = apyPercentFormatted ?? '—';
  const usdBullets: PayCheckListItem[] = [
    {
      body: t('moneyAccountDepositUsdDialogAlwaysWorthBody'),
      id: 'always-worth',
      title: t('moneyAccountDepositUsdDialogAlwaysWorthTitle'),
    },
    {
      body: t('moneyAccountDepositUsdDialogBackedBody'),
      id: 'backed',
      title: t('moneyAccountDepositUsdDialogBackedTitle'),
    },
    {
      body: t('moneyAccountDepositUsdDialogEarnsBody'),
      id: 'earns',
      title: t('moneyAccountDepositUsdDialogEarnsTitle', [
        <span key="apy" className="text-success-default">
          {t('moneyApy', [apyDisplay])}
        </span>,
      ]),
      titleTestId: 'money-usd-dialog-earns-title',
    },
    {
      body: t('moneyAccountDepositNoLockupsBody'),
      id: 'no-lockups',
      title: t('moneyAccountDepositNoLockupsTitle'),
    },
  ];

  return (
    <Box data-testid="receive-row">
      <ConfirmInfoRow label={t('youllReceive')} rowVariant={variant}>
        {valueNode}
      </ConfirmInfoRow>
      {hasReceiveInfoDialog && receiveUsd ? (
        <PayChecklistDialog
          data-testid={MONEY_USD_DIALOG_TEST_ID}
          isOpen={isUsdDialogOpen}
          items={usdBullets}
          lead={t('moneyAccountDepositUsdDialogLead')}
          onClose={closeUsdDialog}
          title={t('moneyAccountDepositUsdDialogTitle', [receiveUsd])}
        />
      ) : null}
    </Box>
  );
}
