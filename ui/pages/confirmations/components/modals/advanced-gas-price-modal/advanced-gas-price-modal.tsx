import React, { useCallback, useMemo, useState } from 'react';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { pickBy } from 'lodash';

import { GasPriceInput } from '../../gas-price-input/gas-price-input';
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
import { GasModalType } from '../../../constants/gas';
import { AdvancedGasFeeModal } from '../advanced-gas-fee-modal/advanced-gas-fee-modal';

type AdvancedGasPriceModalProps = {
  setActiveModal: (modal: GasModalType) => void;
  handleCloseModals: () => void;
};

const AdvancedGasPriceModalContent = ({
  transactionMeta,
  gasLimit,
  isGasLimitAvailable,
  isGasLimitEditable,
  setGasLimit,
  setActiveModal,
  handleCloseModals,
}: AdvancedGasPriceModalProps & {
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
      modalTestId="gas-fee-advanced-gas-price-modal"
      onGasLimitChange={setGasLimit}
      onGasLimitErrorChange={handleGasError}
      onNavigateToEstimates={navigateToEstimatesModal}
      onSave={handleSaveClick}
      title={t('advancedGasPriceModalTitle')}
    >
      <GasPriceInput
        onChange={handleGasPriceChange}
        onErrorChange={handleGasPriceError}
      />
    </AdvancedGasFeeModal>
  );
};

export const AdvancedGasPriceModal = (props: AdvancedGasPriceModalProps) => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const transactionKey = getAdvancedGasLimitTransactionKey(transactionMeta);
  const { gasLimit, isGasLimitAvailable, isGasLimitEditable, setGasLimit } =
    useAdvancedGasLimit(transactionMeta);

  return (
    <AdvancedGasPriceModalContent
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
