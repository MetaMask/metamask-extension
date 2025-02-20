import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { Hex } from '@metamask/utils';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { Container } from '../../shared/transaction-data/transaction-data';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';

const SpendingCapGroup = ({
  tokenSymbol,
  decimals,
  setIsOpenEditSpendingCapModal,
  transactionMeta,
}: {
  tokenSymbol: string;
  decimals: string;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  transactionMeta: TransactionMeta;
}) => {
  const t = useI18nContext();

  const { spendingCap, isUnlimitedSpendingCap, formattedSpendingCap, value } =
    useApproveTokenSimulation(transactionMeta, decimals);

  const SpendingCapElement = (
    <ConfirmInfoRowText
      text={
        isUnlimitedSpendingCap
          ? `${t('unlimited')} ${tokenSymbol}`
          : `${formattedSpendingCap} ${tokenSymbol}`
      }
      onEditClick={() => setIsOpenEditSpendingCapModal(true)}
      editIconClassName="edit-spending-cap-btn"
      editIconDataTestId="edit-spending-cap-icon"
    />
  );

  if (!value) {
    return null;
  }

  return (
    <>
      <ConfirmInfoRowDivider />

      <ConfirmInfoRow
        label={t('spendingCap')}
        tooltip={t('spendingCapTooltipDesc')}
        data-testid="confirmation__approve-spending-cap-group"
      >
        {Boolean(isUnlimitedSpendingCap) ||
        spendingCap !== formattedSpendingCap ? (
          <Tooltip title={spendingCap}>{SpendingCapElement}</Tooltip>
        ) : (
          SpendingCapElement
        )}
      </ConfirmInfoRow>
    </>
  );
};

export const SpendingCap = ({
  data,
  setIsOpenEditSpendingCapModal,
  to,
}: {
  data?: Hex;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  to?: Hex;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const transactionTo = to ?? transactionMeta.txParams.to;
  const transactionData = data ?? transactionMeta.txParams.data;

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionTo,
    transactionMeta.txParams.from,
    transactionData,
    transactionMeta.chainId,
  );

  const accountBalance = calcTokenAmount(
    userBalance ?? '0',
    Number(decimals ?? '0'),
  ).toFixed();

  const finalTransactionMeta = {
    ...transactionMeta,
    txParams: {
      ...transactionMeta.txParams,
      to: transactionTo,
      data: transactionData,
    },
  };

  const { pending } = useApproveTokenSimulation(finalTransactionMeta, decimals);

  if (pending) {
    return <Container isLoading />;
  }

  return (
    <ConfirmInfoSection data-testid="confirmation__approve-spending-cap-section">
      <ConfirmInfoRow label={t('accountBalance')}>
        <ConfirmInfoRowText text={`${accountBalance} ${tokenSymbol || ''}`} />
      </ConfirmInfoRow>

      <SpendingCapGroup
        tokenSymbol={tokenSymbol || ''}
        decimals={decimals || '0'}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        transactionMeta={finalTransactionMeta}
      />
    </ConfirmInfoSection>
  );
};
