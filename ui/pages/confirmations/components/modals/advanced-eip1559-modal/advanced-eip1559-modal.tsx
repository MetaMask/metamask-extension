import React, { useCallback, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import {
  Box,
  Button,
  BoxFlexDirection,
  ButtonVariant,
  BoxAlignItems,
  ButtonSize,
} from '@metamask/design-system-react';
import { useDispatch } from 'react-redux';
import { pickBy } from 'lodash';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '../../../../../components/component-library';
import { GasModalType } from '../../../constants/gas';
import { MaxBaseFeeInput } from '../../max-base-fee-input/max-base-fee-input';
import { PriorityFeeInput } from '../../priority-fee-input/priority-fee-input';
import { GasInput } from '../../gas-input/gas-input';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../../store/actions';

export const AdvancedEIP1559Modal = ({
  setActiveModal,
  handleCloseModals,
}: {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { gas, maxFeePerGas, maxPriorityFeePerGas } =
    transactionMeta?.txParams || {};

  const [gasParams, setGasParams] = useState<{
    gas: Hex;
    maxFeePerGas: Hex;
    maxPriorityFeePerGas: Hex;
  }>({
    gas: gas as Hex,
    maxFeePerGas: maxFeePerGas as Hex,
    maxPriorityFeePerGas: maxPriorityFeePerGas as Hex,
  });

  const [errors, setErrors] = useState<{
    gas: string | undefined;
    maxFeePerGas: string | undefined;
    maxPriorityFeePerGas: string | undefined;
  }>({
    gas: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
  });
  const hasError = Boolean(
    errors.gas || errors.maxFeePerGas || errors.maxPriorityFeePerGas,
  );

  const handleSaveClick = useCallback(() => {
    dispatch(
      updateTransactionGasFees(transactionMeta.id, {
        userFeeLevel: UserFeeLevel.CUSTOM,
        ...pickBy(gasParams, Boolean),
      }),
    );
    handleCloseModals();
  }, [transactionMeta.id, gasParams, handleCloseModals]);

  const navigateToEstimatesModal = useCallback(() => {
    setActiveModal(GasModalType.EstimatesModal);
  }, [setActiveModal]);

  const createChangeHandler = useCallback(
    (key: 'gas' | 'maxFeePerGas' | 'maxPriorityFeePerGas') => (value: Hex) =>
      setGasParams((prev) => ({ ...prev, [key]: value })),
    [],
  );
  const handleGasLimitChange = useMemo(
    () => createChangeHandler('gas'),
    [createChangeHandler],
  );
  const handleMaxFeePerGasChange = useMemo(
    () => createChangeHandler('maxFeePerGas'),
    [createChangeHandler],
  );
  const handleMaxPriorityFeePerGasChange = useMemo(
    () => createChangeHandler('maxPriorityFeePerGas'),
    [createChangeHandler],
  );

  const createErrorHandler = useCallback(
    (key: 'gas' | 'maxFeePerGas' | 'maxPriorityFeePerGas') =>
      (error: string | undefined) =>
        setErrors((prev) => ({ ...prev, [key]: error })),
    [],
  );
  const handleGasError = useMemo(
    () => createErrorHandler('gas'),
    [createErrorHandler],
  );
  const handleMaxFeePerGasError = useMemo(
    () => createErrorHandler('maxFeePerGas'),
    [createErrorHandler],
  );
  const handleMaxPriorityFeePerGasError = useMemo(
    () => createErrorHandler('maxPriorityFeePerGas'),
    [createErrorHandler],
  );

  return (
    <Modal isOpen={true} onClose={handleCloseModals}>
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Md}
        data-testid="gas-fee-advanced-eip1559-modal"
      >
        <ModalHeader>{t('advancedEIP1559ModalTitle')}</ModalHeader>
        <ModalBody>
          <MaxBaseFeeInput
            onChange={handleMaxFeePerGasChange}
            maxPriorityFeePerGas={gasParams.maxPriorityFeePerGas}
            onErrorChange={handleMaxFeePerGasError}
          />
          <Box marginBottom={4} />
          <PriorityFeeInput
            onChange={handleMaxPriorityFeePerGasChange}
            maxFeePerGas={gasParams.maxFeePerGas}
            onErrorChange={handleMaxPriorityFeePerGasError}
          />
          <Box marginBottom={4} />
          <GasInput
            onChange={handleGasLimitChange}
            onErrorChange={handleGasError}
          />
        </ModalBody>
        <ModalFooter>
          <Box
            alignItems={BoxAlignItems.Stretch}
            flexDirection={BoxFlexDirection.Row}
            gap={4}
          >
            <Button
              data-testid="gas-fee-modal-cancel-button"
              style={{ flex: 1 }}
              size={ButtonSize.Lg}
              variant={ButtonVariant.Secondary}
              onClick={navigateToEstimatesModal}
            >
              {t('cancel')}
            </Button>
            <Button
              data-testid="gas-fee-modal-save-button"
              style={{ flex: 1 }}
              size={ButtonSize.Lg}
              isDisabled={hasError}
              onClick={handleSaveClick}
            >
              {t('save')}
            </Button>
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
