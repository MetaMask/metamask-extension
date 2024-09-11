import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { calcTokenAmount } from '../../../../../../../../shared/lib/transactions-controller-utils';
import { hexToDecimal } from '../../../../../../../../shared/modules/conversion.utils';
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
import {
  estimateGas,
  updateEditableParams,
} from '../../../../../../../store/actions';
import { getCustomTxParamsData } from '../../../../../confirm-approve/confirm-approve.util';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { useApproveTokenSimulation } from '../hooks/use-approve-token-simulation';

export const EditSpendingCapModal = ({
  isOpenEditSpendingCapModal,
  setIsOpenEditSpendingCapModal,
}: {
  isOpenEditSpendingCapModal: boolean;
  setIsOpenEditSpendingCapModal: (newValue: boolean) => void;
}) => {
  const t = useI18nContext();

  const dispatch = useDispatch();

  const { currentConfirmation: transactionMeta } = useConfirmContext() as {
    currentConfirmation: TransactionMeta;
  };

  const { userBalance, tokenSymbol, decimals } = useAssetDetails(
    transactionMeta.txParams.to,
    transactionMeta.txParams.from,
    transactionMeta.txParams.data,
  );

  const accountBalance = Number(
    calcTokenAmount(userBalance || '0', Number(decimals || '0')),
  );

  const { formattedSpendingCap } = useApproveTokenSimulation(
    transactionMeta,
    decimals || '0',
  );

  const [customSpendingCapInputValue, setCustomSpendingCapInputValue] =
    useState('');

  const handleCancel = useCallback(() => {
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapInputValue('');
  }, [setIsOpenEditSpendingCapModal, setCustomSpendingCapInputValue]);

  const [isModalSaving, setIsModalSaving] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsModalSaving(true);
    const parsedValue = parseInt(customSpendingCapInputValue, 10);

    const customTxParamsData = getCustomTxParamsData(
      transactionMeta?.txParams?.data,
      {
        customPermissionAmount:
          // coerce negative numbers to zero
          parsedValue < 0 ? '0' : customSpendingCapInputValue || '0',
        decimals: decimals || '0',
      },
    );

    const estimatedGasLimit = await estimateGas({
      from: transactionMeta.txParams.from,
      to: transactionMeta.txParams.to,
      value: transactionMeta.txParams.value,
      data: customTxParamsData,
    });

    dispatch(
      updateEditableParams(transactionMeta.id, {
        data: customTxParamsData,
        gas: hexToDecimal(estimatedGasLimit as string),
      }),
    );

    setIsModalSaving(false);
    setIsOpenEditSpendingCapModal(false);
    setCustomSpendingCapInputValue('');
  }, [customSpendingCapInputValue]);

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
            value={customSpendingCapInputValue}
            onChange={(event) =>
              setCustomSpendingCapInputValue(event.target.value)
            }
            placeholder={`${formattedSpendingCap} ${tokenSymbol}`}
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
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitButtonProps={{ children: t('save'), loading: isModalSaving }}
        />
      </ModalContent>
    </Modal>
  );
};
