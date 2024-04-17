import { isValidAddress } from 'ethereumjs-util';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ConfirmInfoRow,
  ConfirmInfoRowAddress,
  ConfirmInfoRowText,
  ConfirmInfoRowUrl,
} from '../../../../../../components/app/confirm/info/row';
import { Box, Text } from '../../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  TextColor,
} from '../../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import {
  currentConfirmationSelector,
  getKnownMethodData,
  getUseCurrencyRateCheck,
  use4ByteResolutionSelector,
} from '../../../../../../selectors';
import { getContractMethodData } from '../../../../../../store/actions';
import { TransactionRequestType } from '../../../../types/confirm';
import { SimulationDetails } from '../../../simulation-details';
import { ConfirmGasDisplay } from '../../../confirm-gas-display';
import { GasFeeContextProvider } from '../../../../../../contexts/gasFee';

import FeeDetailsComponent from '../../../fee-details-component/fee-details-component';
import { TransactionModalContextProvider } from '../../../../../../contexts/transaction-modal';
import EditGasPopover from '../../../edit-gas-popover/edit-gas-popover.component';
import { EditGasModes } from '../../../../../../../shared/constants/gas';
import { isLegacyTransaction } from '../../../../../../../shared/modules/transaction.utils';

const ContractInteractionInfo: React.FC = () => {
  const t = useI18nContext();
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionRequestType;

  if (!currentConfirmation?.txParams) {
    return null;
  }

  const dispatch = useDispatch();

  const use4ByteResolution = useSelector(use4ByteResolutionSelector);
  if (use4ByteResolution) {
    dispatch(getContractMethodData(currentConfirmation.txParams?.data));
  }

  const knownMethodData =
    useSelector((state) =>
      getKnownMethodData(state, currentConfirmation.txParams?.data),
    ) || {};

  console.log({ currentConfirmation });

  const [userAcknowledgedGasMissing, setUserAcknowledgedGasMissing] =
    React.useState(true);

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] =
    React.useState(false);

  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);

  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const transactionType = draftTransaction?.transactionType;
  let isLegacyTxn;
  if (transactionType) {
    isLegacyTxn = transactionType === TransactionEnvelopeType.legacy;
  } else {
    isLegacyTxn = isLegacyTransaction(currentConfirmation.txParams);
  }

  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const supportsEIP1559 = networkAndAccountSupports1559 && !isLegacyTxn;

  return (
    <>
      <GasFeeContextProvider transaction={currentConfirmation}>
        <TransactionModalContextProvider>
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <SimulationDetails
              simulationData={currentConfirmation.simulationData}
              transactionId={currentConfirmation.id}
            />
          </Box>
          {/* Contract interaction section */}
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <ConfirmInfoRow
              label={t('requestFrom')}
              tooltip={t('requestFromInfo')}
            >
              <ConfirmInfoRowUrl url={currentConfirmation.origin} />
            </ConfirmInfoRow>
            {isValidAddress(currentConfirmation.txParams.to) && (
              <ConfirmInfoRow label={t('interactingWith')}>
                <ConfirmInfoRowAddress
                  address={currentConfirmation.txParams.to}
                />
              </ConfirmInfoRow>
            )}
            {knownMethodData?.name && (
              <ConfirmInfoRow label={'Method'}>
                <ConfirmInfoRowText text={knownMethodData.name} />
              </ConfirmInfoRow>
            )}
          </Box>
          <Box
            backgroundColor={BackgroundColor.backgroundDefault}
            borderRadius={BorderRadius.MD}
            padding={2}
            marginBottom={4}
          >
            <ConfirmGasDisplay
              userAcknowledgedGasMissing={userAcknowledgedGasMissing}
            />
            <FeeDetailsComponent
              useCurrencyRateCheck={useCurrencyRateCheck}
              txData={currentConfirmation}
            />
            {/* <GasDetailsItem
            userAcknowledgedGasMissing={userAcknowledgedGasMissing}
          /> */}
          </Box>
          {/* legacy popover */}
          {!supportsEIP1559 && showCustomizeGasPopover && (
            <EditGasPopover
              onClose={closeCustomizeGasPopover}
              mode={EditGasModes.modifyInPlace}
              transaction={currentConfirmation}
            />
          )}
          {supportsEIP1559 && (
            <>
              <EditGasFeePopover />
              <AdvancedGasFeePopover />
            </>
          )}
        </TransactionModalContextProvider>
      </GasFeeContextProvider>
    </>
  );
};

export default ContractInteractionInfo;
