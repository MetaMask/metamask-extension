import React, { useCallback, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { pickBy } from 'lodash';
import {
  Box,
  Button,
  BoxFlexDirection,
  ButtonVariant,
  BoxAlignItems,
  ButtonSize,
} from '@metamask/design-system-react';
import { useDispatch } from 'react-redux';

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
import { GasPriceInput } from '../../gas-price-input/gas-price-input';
import { GasInput } from '../../gas-input/gas-input';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../../store/actions';

export const AdvancedGasPriceModal = ({
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

  const { gas, gasPrice } = transactionMeta?.txParams || {};

  const [gasParams, setGasParams] = useState<{
    gas: Hex;
    gasPrice: Hex;
  }>({
    gas: gas as Hex,
    gasPrice: gasPrice as Hex,
  });

  const [errors, setErrors] = useState<{
    gas: string | undefined;
    gasPrice: string | undefined;
  }>({
    gas: undefined,
    gasPrice: undefined,
  });
  const hasError = Boolean(errors.gas || errors.gasPrice);

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
    (key: 'gas' | 'gasPrice') => (value: Hex) =>
      setGasParams((prev) => ({ ...prev, [key]: value })),
    [],
  );
  const handleGasChange = useMemo(
    () => createChangeHandler('gas'),
    [createChangeHandler],
  );
  const handleGasPriceChange = useMemo(
    () => createChangeHandler('gasPrice'),
    [createChangeHandler],
  );

  const createErrorHandler = useCallback(
    (key: 'gas' | 'gasPrice') => (error: string | undefined) =>
      setErrors((prev) => ({ ...prev, [key]: error })),
    [],
  );
  const handleGasError = useMemo(
    () => createErrorHandler('gas'),
    [createErrorHandler],
  );
  const handleGasPriceError = useMemo(
    () => createErrorHandler('gasPrice'),
    [createErrorHandler],
  );

  return (
    <Modal isOpen={true} onClose={handleCloseModals}>
      <ModalOverlay />
      <ModalContent
        size={ModalContentSize.Md}
        data-testid="gas-fee-advanced-gas-price-modal"
      >
        <ModalHeader>{t('advancedGasPriceModalTitle')}</ModalHeader>
        <ModalBody>
          <GasPriceInput
            onChange={handleGasPriceChange}
            onErrorChange={handleGasPriceError}
          />
          <Box marginBottom={4} />
          <GasInput onChange={handleGasChange} onErrorChange={handleGasError} />
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
