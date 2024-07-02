import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import {
  addHexes,
  multiplyHexes,
} from '../../../../../../../../shared/modules/conversion.utils';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { useGasFeeEstimates } from '../../../../../../../hooks/useGasFeeEstimates';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import EditGasPopover from '../../../../edit-gas-popover';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { HEX_ZERO } from '../constants';
import { GasFeesDetails } from './gas-fees-details';

function getGasFeeEstimate(
  transactionMeta: TransactionMeta,
  supportsEIP1559: boolean,
): Hex {
  let { gas: gasLimit, gasPrice } = transactionMeta.txParams;

  const { gasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  );
  const estimatedBaseFee = (gasFeeEstimates as GasFeeEstimates)
    ?.estimatedBaseFee;

  // override with values from `dappSuggestedGasFees` if they exist
  gasLimit = transactionMeta.dappSuggestedGasFees?.gas || gasLimit || HEX_ZERO;
  gasPrice =
    transactionMeta.dappSuggestedGasFees?.gasPrice || gasPrice || HEX_ZERO;
  const maxPriorityFeePerGas =
    transactionMeta.dappSuggestedGasFees?.maxPriorityFeePerGas ||
    transactionMeta.txParams?.maxPriorityFeePerGas ||
    HEX_ZERO;

  let gasEstimate: Hex;
  if (supportsEIP1559) {
    // Minimum Total Fee = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
    const minimumFeePerGas = addHexes(
      estimatedBaseFee || HEX_ZERO,
      maxPriorityFeePerGas,
    );

    gasEstimate = multiplyHexes(minimumFeePerGas as Hex, gasLimit as Hex);
  } else {
    gasEstimate = multiplyHexes(gasPrice as Hex, gasLimit as Hex);
  }

  return gasEstimate;
}

const LegacyTransactionGasModal = ({
  closeCustomizeGasPopover,
  transactionMeta,
}: {
  closeCustomizeGasPopover: () => void;
  transactionMeta: TransactionMeta;
}) => {
  return (
    <EditGasPopover
      onClose={closeCustomizeGasPopover}
      mode={EditGasModes.modifyInPlace}
      transaction={transactionMeta}
    />
  );
};

export const GasFeesSection = ({
  showAdvancedDetails,
}: {
  showAdvancedDetails: boolean;
}) => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);
  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);

  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  if (!transactionMeta?.txParams) {
    return null;
  }

  return (
    <ConfirmInfoSection>
      <GasFeesDetails
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        showAdvancedDetails={showAdvancedDetails}
      />
      {!supportsEIP1559 && showCustomizeGasPopover && (
        <LegacyTransactionGasModal
          closeCustomizeGasPopover={closeCustomizeGasPopover}
          transactionMeta={transactionMeta}
        />
      )}
    </ConfirmInfoSection>
  );
};
