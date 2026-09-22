import React, { useCallback, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { Box } from '@metamask/design-system-react';
import { pickBy } from 'lodash';

import { MaxBaseFeeInput } from '../../max-base-fee-input/max-base-fee-input';
import { PriorityFeeInput } from '../../priority-fee-input/priority-fee-input';
import {
  getAdvancedGasLimitTransactionKey,
  useAdvancedGasLimit,
} from '../../../hooks/gas/useAdvancedGasLimit';
import { useConfirmContext } from '../../../context/confirm';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../../store/actions/update-transaction-gas-fees';
import { hexWEIToDecGWEI } from '../../../../../../shared/lib/conversion.utils';
import { usePersistGasFeePreference } from '../../../hooks/gas/usePersistGasFeePreference';
import { useDispatch } from '../../../../../store/hooks';
import { GasModalType } from '../../../constants/gas';
import { AdvancedGasFeeModal } from '../advanced-gas-fee-modal/advanced-gas-fee-modal';

type AdvancedEIP1559ModalProps = {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
};

const AdvancedEIP1559ModalContent = ({
  transactionMeta,
  gasLimit,
  isGasLimitAvailable,
  isGasLimitEditable,
  setGasLimit,
  setActiveModal,
  handleCloseModals,
}: AdvancedEIP1559ModalProps & {
  transactionMeta: TransactionMeta;
  gasLimit: Hex | undefined;
  isGasLimitAvailable: boolean;
  isGasLimitEditable: boolean;
  setGasLimit: (gasLimit: Hex) => void;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const persistGasFeePreference = usePersistGasFeePreference();

  const [gasParams, setGasParams] = useState<{
    maxFeePerGas: Hex;
    maxPriorityFeePerGas: Hex;
  }>({
    maxFeePerGas:
      (transactionMeta?.txParams?.maxFeePerGas as Hex) ?? ('0x0' as Hex),
    maxPriorityFeePerGas:
      (transactionMeta?.txParams?.maxPriorityFeePerGas as Hex) ??
      ('0x0' as Hex),
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
      maxBaseFee: hexWEIToDecGWEI(gasParams.maxFeePerGas),
      priorityFee: hexWEIToDecGWEI(gasParams.maxPriorityFeePerGas),
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

  const createChangeHandler = useCallback(
    (key: 'maxFeePerGas' | 'maxPriorityFeePerGas') => (value: Hex) =>
      setGasParams((prev) => ({ ...prev, [key]: value })),
    [],
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

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <AdvancedGasFeeModal
      gasLimit={gasLimit}
      handleCloseModals={handleCloseModals}
      hasError={hasError}
      isGasEstimationFailed={Boolean(
        transactionMeta.simulationFails &&
        transactionMeta.userFeeLevel !== UserFeeLevel.CUSTOM,
      )}
      isGasLimitAvailable={isGasLimitAvailable}
      isGasLimitEditable={isGasLimitEditable}
      modalTestId="gas-fee-advanced-eip1559-modal"
      onGasLimitChange={setGasLimit}
      onGasLimitErrorChange={handleGasError}
      onNavigateToEstimates={navigateToEstimatesModal}
      onSave={handleSaveClick}
      title={t('advancedEIP1559ModalTitle')}
    >
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
    </AdvancedGasFeeModal>
  );
};

export const AdvancedEIP1559Modal = (props: AdvancedEIP1559ModalProps) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const transactionKey = getAdvancedGasLimitTransactionKey(transactionMeta);
  const { gasLimit, isGasLimitAvailable, isGasLimitEditable, setGasLimit } =
    useAdvancedGasLimit(transactionMeta);

  return (
    <AdvancedEIP1559ModalContent
      key={transactionKey}
      transactionMeta={transactionMeta}
      gasLimit={gasLimit}
      isGasLimitAvailable={isGasLimitAvailable}
      isGasLimitEditable={isGasLimitEditable}
      setGasLimit={setGasLimit}
      {...props}
    />
  );
};
