import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import {
  addHexes,
  getEthConversionFromWeiHex,
  getValueFromWeiHex,
  multiplyHexes,
} from '../../../../../../../../shared/modules/conversion.utils';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { getConversionRate } from '../../../../../../../ducks/metamask/metamask';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  currentConfirmationSelector,
  getCurrentCurrency,
} from '../../../../../../../selectors';
import EditGasPopover from '../../../../edit-gas-popover';
import { useEIP1559TxFees } from '../../hooks/useEIP1559TxFees';
import { useSupportsEIP1559 } from '../../hooks/useSupportsEIP1559';
import { GasFeeInfo } from './gas-fees-info';
import { Layer2GasFeesDetails } from './layer-two-gas-fees-details';

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

export const RedesignedGasFees = () => {
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

  const nativeCurrencyFees = getEthConversionFromWeiHex({
    value: gasEstimate,
    fromCurrency: EtherDenomination.GWEI,
    numberOfDecimals: 4,
  });

  const currentCurrency = useSelector(getCurrentCurrency);
  const conversionRate = useSelector(getConversionRate);

  const fiatFormatter = useFiatFormatter();

  const currentCurrencyFees = fiatFormatter(
    Number(
      getValueFromWeiHex({
        value: gasEstimate,
        conversionRate,
        fromCurrency: EtherDenomination.GWEI,
        toCurrency: currentCurrency,
        numberOfDecimals: 2,
      }),
    ),
  );

  return (
    <ConfirmInfoSection>
      <GasFeeInfo
        currentCurrencyFees={currentCurrencyFees}
        nativeCurrencyFees={nativeCurrencyFees}
        supportsEIP1559={supportsEIP1559}
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        maxFeePerGas={maxFeePerGas}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
      />

      <Layer2GasFeesDetails gasEstimate={gasEstimate} />

      {!supportsEIP1559 && showCustomizeGasPopover && (
        <Type0TxGasModal
          closeCustomizeGasPopover={closeCustomizeGasPopover}
          transactionMeta={transactionMeta}
        />
      )}
    </ConfirmInfoSection>
  );
};
