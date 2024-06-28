import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import {
  addHexes,
  multiplyHexes,
} from '../../../../../../../../shared/modules/conversion.utils';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { currentConfirmationSelector } from '../../../../../../../selectors';
import EditGasPopover from '../../../../edit-gas-popover';
import { useEIP1559TxFees } from '../../hooks/useEIP1559TxFees';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { FeesDetails } from './fees-details';

// TODO(pnf): review localization once design and copy are finalized

function getGasEstimate(
  transactionMeta: TransactionMeta,
  supportsEIP1559: boolean,
): string {
  let { gas: gasLimit, gasPrice } = (transactionMeta as TransactionMeta)
    .txParams;
  const { estimatedBaseFee } = (transactionMeta as TransactionMeta).txParams;

  // override with values from `dappSuggestedGasFees` if they exist
  gasLimit = transactionMeta.dappSuggestedGasFees?.gas || gasLimit || '0x0';
  gasPrice =
    transactionMeta.dappSuggestedGasFees?.gasPrice || gasPrice || '0x0';
  const maxPriorityFeePerGas =
    transactionMeta.dappSuggestedGasFees?.maxPriorityFeePerGas ||
    transactionMeta.txParams?.maxPriorityFeePerGas ||
    '0x0';

  let gasEstimate;
  if (supportsEIP1559) {
    // Minimum Total Fee = (estimatedBaseFee + maxPriorityFeePerGas) * gasLimit
    const minimumFeePerGas = addHexes(
      estimatedBaseFee || '0x0',
      maxPriorityFeePerGas,
    );

    gasEstimate = multiplyHexes(minimumFeePerGas, gasLimit);
  } else {
    gasEstimate = multiplyHexes(gasLimit, gasPrice);
  }

  return gasEstimate;
}

const Type0TxGasModal = ({
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

export const RedesignedGasFees = ({
  showAdvancedDetails,
}: {
  showAdvancedDetails: boolean;
}) => {
  const transactionMeta = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!transactionMeta?.txParams) {
    return null;
  }

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);
  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(transactionMeta);

  const gasEstimate = getGasEstimate(transactionMeta, supportsEIP1559);

  return (
    <ConfirmInfoSection>
      <FeesDetails
        gasEstimate={gasEstimate}
        maxFeePerGas={maxFeePerGas}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        showAdvancedDetails={showAdvancedDetails}
      />
      {!supportsEIP1559 && showCustomizeGasPopover && (
        <Type0TxGasModal
          closeCustomizeGasPopover={closeCustomizeGasPopover}
          transactionMeta={transactionMeta}
        />
      )}
    </ConfirmInfoSection>
  );
};
