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
import { GAS_INPUT_HELP_TEXT_ID, GasInput } from '../../gas-input/gas-input';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../../store/actions/update-transaction-gas-fees';
import { hexWEIToDecGWEI } from '../../../../../../shared/lib/conversion.utils';
import { usePersistGasFeePreference } from '../../../hooks/gas/usePersistGasFeePreference';
import {
  getAdvancedGasLimitTransactionKey,
  useAdvancedGasLimit,
} from '../../../hooks/gas/useAdvancedGasLimit';
import { useDispatch } from '../../../../../store/hooks';

type AdvancedGasPriceModalProps = {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
};

const AdvancedGasPriceModalContent = ({
  transactionMeta,
  gasLimit,
  isGasLimitAvailable,
  setGasLimit,
  setActiveModal,
  handleCloseModals,
}: AdvancedGasPriceModalProps & {
  transactionMeta: TransactionMeta;
  gasLimit: Hex | undefined;
  isGasLimitAvailable: boolean;
  setGasLimit: (gasLimit: Hex) => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const persistGasFeePreference = usePersistGasFeePreference();

  const [gasParams, setGasParams] = useState<{
    gasPrice: Hex;
  }>({
    gasPrice: (transactionMeta?.txParams?.gasPrice as Hex) ?? ('0x0' as Hex),
  });

  const [errors, setErrors] = useState<{
    gas: string | undefined;
    gasPrice: string | undefined;
  }>({
    gas: undefined,
    gasPrice: undefined,
  });
  const hasError = Boolean(errors.gas || errors.gasPrice);

  const handleSaveClick = useCallback(async () => {
    if (!transactionMeta?.id || !isGasLimitAvailable || !gasLimit) {
      return;
    }
    await dispatch(
      updateTransactionGasFees(transactionMeta.id, {
        userFeeLevel: UserFeeLevel.CUSTOM,
        gas: gasLimit,
        ...pickBy(gasParams, Boolean),
      }),
    );
    await persistGasFeePreference(transactionMeta, {
      userFeeLevel: UserFeeLevel.CUSTOM,
      gasPrice: hexWEIToDecGWEI(gasParams.gasPrice),
    });
    handleCloseModals();
  }, [
    transactionMeta,
    gasLimit,
    isGasLimitAvailable,
    gasParams,
    handleCloseModals,
    dispatch,
    persistGasFeePreference,
  ]);

  const navigateToEstimatesModal = useCallback(() => {
    setActiveModal(GasModalType.EstimatesModal);
  }, [setActiveModal]);

  const handleGasPriceChange = useCallback(
    (value: Hex) => setGasParams({ gasPrice: value }),
    [],
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

  if (!transactionMeta?.txParams) {
    return null;
  }

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
          <GasInput
            gasLimit={gasLimit}
            helpText={
              isGasLimitAvailable ? undefined : t('gasLimitEditingUnavailable')
            }
            isDisabled={!isGasLimitAvailable}
            onChange={setGasLimit}
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
              aria-describedby={
                isGasLimitAvailable ? undefined : GAS_INPUT_HELP_TEXT_ID
              }
              data-testid="gas-fee-modal-save-button"
              style={{ flex: 1 }}
              size={ButtonSize.Lg}
              isDisabled={hasError || !isGasLimitAvailable}
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

export const AdvancedGasPriceModal = (props: AdvancedGasPriceModalProps) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const transactionKey = getAdvancedGasLimitTransactionKey(transactionMeta);
  const modalStateKey = `${transactionKey}:${transactionMeta?.txParams?.gasPrice}`;
  const { gasLimit, isGasLimitAvailable, setGasLimit } =
    useAdvancedGasLimit(transactionMeta);

  return (
    <AdvancedGasPriceModalContent
      key={modalStateKey}
      transactionMeta={transactionMeta}
      gasLimit={gasLimit}
      isGasLimitAvailable={isGasLimitAvailable}
      setGasLimit={setGasLimit}
      {...props}
    />
  );
};
