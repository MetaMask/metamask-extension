import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import {
  getEthConversionFromWeiHex,
  getValueFromWeiHex,
  hexToDecimal,
  subtractHexes,
} from '../../../../../../../../shared/modules/conversion.utils';
import { getMinimumGasTotalInHexWei } from '../../../../../../../../shared/modules/gas.utils';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  IconName,
  Text,
} from '../../../../../../../components/component-library';
import { useTransactionModalContext } from '../../../../../../../contexts/transaction-modal';
import { getConversionRate } from '../../../../../../../ducks/metamask/metamask';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  currentConfirmationSelector,
  getCurrentCurrency,
} from '../../../../../../../selectors';
import { useTransactionEventFragment } from '../../../../../hooks/useTransactionEventFragment';
import AdvancedGasFeePopover from '../../../../advanced-gas-fee-popover';
import EditGasFeePopover from '../../../../edit-gas-fee-popover';
import EditGasPopover from '../../../../edit-gas-popover';
import GasTiming from '../../../../gas-timing';
import { useSupportsEIP1559 } from '../../hooks/supports-eip-1559';

export const RedesignedGasFees = () => {
  const currentConfirmation = useSelector(
    currentConfirmationSelector,
  ) as TransactionMeta;

  if (!currentConfirmation?.txParams) {
    return null;
  }

  const [showCustomizeGasPopover, setShowCustomizeGasPopover] = useState(false);
  const closeCustomizeGasPopover = () => setShowCustomizeGasPopover(false);
  const { supportsEIP1559 } = useSupportsEIP1559(currentConfirmation);

  let gasEstimate;
  if (supportsEIP1559) {
    const baseFeePerGas = subtractHexes(
      currentConfirmation.txParams.maxFeePerGas as string,
      currentConfirmation.txParams.maxPriorityFeePerGas as string,
    );

    gasEstimate = getMinimumGasTotalInHexWei({
      ...currentConfirmation.txParams,
      gasLimit: currentConfirmation.txParams.gas,
      baseFeePerGas,
    });
  } else {
    gasEstimate = getMinimumGasTotalInHexWei({
      ...currentConfirmation.txParams,
      gasLimit: currentConfirmation.txParams.gas,
    });
  }

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
        conversionRate: conversionRate,
        fromCurrency: EtherDenomination.GWEI,
        toCurrency: currentCurrency,
        numberOfDecimals: 2,
      }),
    ),
  );

  const maxFeePerGas = currentConfirmation?.txParams?.maxFeePerGas
    ? Number(hexToDecimal(currentConfirmation.txParams.maxFeePerGas))
    : 0;

  const maxPriorityFeePerGas = currentConfirmation?.txParams
    ?.maxPriorityFeePerGas
    ? Number(hexToDecimal(currentConfirmation.txParams.maxPriorityFeePerGas))
    : 0;

  return (
    <>
      <ConfirmInfoRow
        label="Estimated fee"
        variant={ConfirmInfoRowVariant.Default}
        tooltip="estimated fee tooltip"
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          alignItems={AlignItems.center}
          textAlign={TextAlign.Center}
          style={{ flexGrow: '1' }}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Row}
            justifyContent={JustifyContent.spaceEvenly}
            alignItems={AlignItems.center}
            textAlign={TextAlign.Center}
            style={{ flexGrow: '1' }}
          >
            <Text color={TextColor.textAlternative}>{currentCurrencyFees}</Text>
            <Text color={TextColor.textAlternative}>{nativeCurrencyFees}</Text>
          </Box>

          <EditGasEIP1559Icon
            supportsEIP1559={supportsEIP1559}
            setShowCustomizeGasPopover={setShowCustomizeGasPopover}
          />
        </Box>
      </ConfirmInfoRow>

      {supportsEIP1559 && (
        <ConfirmInfoRow
          label="Gas speed"
          variant={ConfirmInfoRowVariant.Default}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center}>
            {/* TODO: Fix bug in the gas timing component after selection is made */}
            <GasTiming
              maxFeePerGas={maxFeePerGas}
              maxPriorityFeePerGas={maxPriorityFeePerGas}
            />
          </Box>
        </ConfirmInfoRow>
      )}

      {/* TODO: Add separator */}

      <ConfirmInfoRow
        label="Total"
        variant={ConfirmInfoRowVariant.Default}
        tooltip="total tooltip"
      >
        <Text>{nativeCurrencyFees}</Text>
      </ConfirmInfoRow>

      {supportsEIP1559 && (
        <>
          <EditGasFeePopover />
          <AdvancedGasFeePopover />
        </>
      )}

      {/* TODO: Fix total after modal */}
      {!supportsEIP1559 && showCustomizeGasPopover && (
        <EditGasPopover
          onClose={closeCustomizeGasPopover}
          mode={EditGasModes.modifyInPlace}
          transaction={currentConfirmation}
        />
      )}
    </>
  );
};

const EditGasEIP1559Icon = ({
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  const { openModal } = useTransactionModalContext() as {
    openModal: (modalId: string) => void;
  };
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const openEditEIP1559TxGasFeeModal = () => {
    updateTransactionEventFragment({
      gas_edit_attempted: 'basic',
    });
    openModal('editGasFee');
  };

  const openEditGasFeeLegacyTxModal = () => {
    // TODO: Add metric event here?
    setShowCustomizeGasPopover(true);
  };

  const openEditGasFeeModal = () =>
    supportsEIP1559
      ? openEditEIP1559TxGasFeeModal()
      : openEditGasFeeLegacyTxModal();

  return (
    <Button
      style={{ textDecoration: 'none' }}
      size={ButtonSize.Sm}
      variant={ButtonVariant.Link}
      startIconName={IconName.Edit}
      color={IconColor.primaryDefault}
      data-testid="edit-gas-fee-icon"
      onClick={openEditGasFeeModal}
    />
  );
};
