import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import {
  getCustomNonceValue,
  getNextSuggestedNonce,
  getUseNonceField,
} from '../../../../../../../selectors';
import {
  getNextNonce,
  showModal,
  updateCustomNonce,
} from '../../../../../../../store/actions';
import { TransactionData } from '../transaction-data/transaction-data';

const NonceDetails = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getNextNonce());
  }, [dispatch]);

  const enableCustomNonce = useSelector(getUseNonceField);
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
          onEditClick={
            enableCustomNonce ? () => openEditNonceModal() : undefined
          }
          editIconClassName="edit-nonce-btn"
        />
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export const AdvancedDetails: React.FC = () => {
  return (
    <>
      <NonceDetails />
      <TransactionData />
    </>
  );
};
