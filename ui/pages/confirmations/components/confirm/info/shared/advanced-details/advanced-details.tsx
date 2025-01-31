import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';

import { Hex } from '@metamask/utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  getCustomNonceValue,
  getNextSuggestedNonce,
} from '../../../../../../../selectors';
import {
  getNextNonce,
  showModal,
  updateCustomNonce,
} from '../../../../../../../store/actions';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { useConfirmContext } from '../../../../../context/confirm';
import { isSignatureTransactionType } from '../../../../../utils';
import { TransactionData } from '../transaction-data/transaction-data';
import { NestedTransactions } from '../../transaction-batch/transaction-batch-item';

const NonceDetails = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const t = useI18nContext();
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      currentConfirmation &&
      !isSignatureTransactionType(currentConfirmation)
    ) {
      dispatch(getNextNonce(currentConfirmation.txParams.from));
    }
  }, [currentConfirmation, dispatch]);

  const nextNonce = useSelector(getNextSuggestedNonce);
  const customNonceValue = useSelector(getCustomNonceValue);

  const openEditNonceModal = () =>
    dispatch(
      showModal({
        name: 'CUSTOMIZE_NONCE',
        customNonceValue,
        nextNonce,
        updateCustomNonce: (value: string) => {
          dispatch(updateCustomNonce(value));
        },
        getNextNonce,
      }),
    );

  const displayedNonce = customNonceValue || nextNonce;

  return (
    <ConfirmInfoSection data-testid="advanced-details-nonce-section">
      <ConfirmInfoRow
        label={t('advancedDetailsNonceDesc')}
        tooltip={t('advancedDetailsNonceTooltip')}
      >
        <ConfirmInfoRowText
          data-testid="advanced-details-displayed-nonce"
          text={`${displayedNonce}`}
          onEditClick={() => openEditNonceModal()}
          editIconClassName="edit-nonce-btn"
          editIconDataTestId="edit-nonce-icon"
        />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export const AdvancedDetails = ({
  overrideVisibility = false,
}: {
  overrideVisibility?: boolean;
}) => {
  const showAdvancedDetails = useSelector(
    selectConfirmationAdvancedDetailsOpen,
  );

  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { nestedTransactions, txParams, type } = currentConfirmation || {};
  const isBatch = type === TransactionType.batch;

  if (!overrideVisibility && !showAdvancedDetails) {
    return null;
  }

  return (
    <>
      <NonceDetails />
      {!isBatch && (
        <TransactionData
          transactionData={txParams?.data as Hex}
          transactionTo={txParams?.to as Hex}
        />
      )}
      {isBatch && (
        <NestedTransactions nestedTransactions={nestedTransactions} />
      )}
    </>
  );
};
