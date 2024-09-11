import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowDivider,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import Tooltip from '../../../../../../../components/ui/tooltip';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { UNLIMITED_MSG } from '../../../../../constants';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { Container } from '../../shared/transaction-data/transaction-data';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';

const SpendingCapGroup = ({
  tokenSymbol,
  decimals,
  setIsOpenEditSpendingCapModal,
  customSpendingCap,
}: {
  tokenSymbol: string;
  decimals: string;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  customSpendingCap: string;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const { spendingCap, formattedSpendingCap, value } =
    useApproveTokenSimulation(transactionMeta, decimals);

  const spendingCapValue =
    customSpendingCap === '' ? formattedSpendingCap : customSpendingCap;

  const SpendingCapElement = (
    <ConfirmInfoRowText
      text={
        spendingCap === UNLIMITED_MSG
          ? `${t('unlimited')} ${tokenSymbol}`
          : `${spendingCapValue} ${tokenSymbol}`
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
      >
        {spendingCap === UNLIMITED_MSG ? (
          <Tooltip title={formattedSpendingCap}>{SpendingCapElement}</Tooltip>
        ) : (
          SpendingCapElement
        )}
      </ConfirmInfoRow>
    </>
  );
};

export const SpendingCap = ({
  setIsOpenEditSpendingCapModal,
}: {
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
}) => {
  const t = useI18nContext();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const accountBalance = calcTokenAmount(
    userBalance || '0',
    Number(decimals || '0'),
  );

  const { pending, spendingCap } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  if (pending) {
    return <Container isLoading />;
  }

  return (
    <ConfirmInfoSection>
      <ConfirmInfoRow label={t('accountBalance')}>
        <ConfirmInfoRowText text={`${accountBalance} ${tokenSymbol || ''}`} />
      </ConfirmInfoRow>

      <SpendingCapGroup
        tokenSymbol={tokenSymbol || ''}
        decimals={decimals || '0'}
        setIsOpenEditSpendingCapModal={setIsOpenEditSpendingCapModal}
        customSpendingCap={spendingCap}
      />
    </ConfirmInfoSection>
  );
};
