import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import React, { useState } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  TextField,
  TextFieldType,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';

export const getAccountBalance = (userBalance: string, decimals: string) =>
  new BigNumber(userBalance)
    .dividedBy(new BigNumber(10).pow(Number(decimals)))
    .toNumber();

export const EditSpendingCapModal = ({
  isOpenEditSpendingCapModal,
  setIsOpenEditSpendingCapModal,
  customSpendingCap,
  setCustomSpendingCap,
}: {
  isOpenEditSpendingCapModal: boolean;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
  customSpendingCap: string;
  setCustomSpendingCap: (newValue: string) => void;
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

  const accountBalance = getAccountBalance(userBalance || '0', decimals || '0');

  const { formattedSpendingCap } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  const [customSpendingCapCandidate, setCustomSpendingCapCandidate] =
    useState('');

  const onCancelHandler = () => {
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapCandidate('');
  };

  function submitEditSpendingCap() {
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapCandidate('');
    setCustomSpendingCap(customSpendingCapCandidate);
  }

  return (
    <Modal
      isOpen={isOpenEditSpendingCapModal}
      onClose={() => setIsOpenEditSpendingCapModal(false)}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      className="edit-spending-cap-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          justifyContent={JustifyContent.center}
          childrenWrapperProps={{
            alignItems: AlignItems.center,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
          }}
        >
          <Text variant={TextVariant.headingMd}>{t('editSpendingCap')}</Text>
        </ModalHeader>
        <ModalBody>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            paddingBottom={4}
          >
            {t('editSpendingCapDesc')}
          </Text>
          <TextField
            type={TextFieldType.Number}
            value={customSpendingCapCandidate}
            onChange={(event) =>
              setCustomSpendingCapCandidate(event.target.value)
            }
            placeholder={`${
              customSpendingCap === ''
                ? formattedSpendingCap
                : customSpendingCap
            } ${tokenSymbol}`}
            style={{ width: '100%' }}
            inputProps={{ 'data-testid': 'custom-spending-cap-input' }}
          />
          <Text
            variant={TextVariant.bodySm}
            color={TextColor.textAlternative}
            paddingTop={1}
          >
            {t('editSpendingCapAccountBalance', [
              accountBalance,
              tokenSymbol || '',
            ])}
          </Text>
        </ModalBody>
        <ModalFooter
          onSubmit={() => submitEditSpendingCap()}
          onCancel={() => onCancelHandler()}
          submitButtonProps={{ children: t('save') }}
        />
      </ModalContent>
    </Modal>
  );
};
