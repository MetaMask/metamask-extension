import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getIsSmartTransaction,
  type SmartTransactionsState,
} from '../../../../../../../../shared/modules/selectors';
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
import { useConfirmContext } from '../../../../../context/confirm';
import { selectConfirmationAdvancedDetailsOpen } from '../../../../../selectors/preferences';
import { isSignatureTransactionType } from '../../../../../utils';
import { TransactionData } from '../transaction-data/transaction-data';
import { NestedTransactionData } from '../../batch/nested-transaction-data/nested-transaction-data';

const NonceDetails = () => {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const t = useI18nContext();
  const dispatch = useDispatch();

  useEffect(() => {
    if (
      currentConfirmation &&
      !isSignatureTransactionType(currentConfirmation)
    ) {
      dispatch(
        getNextNonce(
          currentConfirmation.txParams.from,
          currentConfirmation.networkClientId,
        ),
      );
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
  const isSmartTransactionsEnabled = useSelector(
    (state: SmartTransactionsState) =>
      getIsSmartTransaction(state, currentConfirmation?.chainId),
  );

  return (
    <ConfirmInfoSection data-testid="advanced-details-nonce-section">
      <ConfirmInfoRow
        label={t('advancedDetailsNonceDesc')}
        tooltip={t('advancedDetailsNonceTooltip')}
      >
        <ConfirmInfoRowText
          data-testid="advanced-details-displayed-nonce"
          text={`${displayedNonce}`}
          onEditClick={
            isSmartTransactionsEnabled ? undefined : () => openEditNonceModal()
          }
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

  if (!overrideVisibility && !showAdvancedDetails) {
    return null;
  }

  return (
    <>
      <NonceDetails />
      <TransactionData />
      <NestedTransactionData />
    </>
  );
};
