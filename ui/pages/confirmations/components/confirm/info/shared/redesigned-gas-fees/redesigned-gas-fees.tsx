import { TransactionMeta } from '@metamask/transaction-controller';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
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

// TODO:
// - Assert gas on e2e tests (1)
// - Refactor components (2)

// - Add metric event when opening legacy tx modal
// - Add L2 tests and logic
// - Add Simulations to e2e tests

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

  const useEIP1559TxFees = (currentConfirmation: TransactionMeta) => {
    const [maxFeePerGas, setMaxFeePerGas] = useState(0);
    const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(0);

    useEffect(() => {
      const newMaxFeePerGas = currentConfirmation?.txParams?.maxFeePerGas
        ? Number(hexToDecimal(currentConfirmation.txParams.maxFeePerGas))
        : 0;

      const newMaxPriorityFeePerGas = currentConfirmation?.txParams
        ?.maxPriorityFeePerGas
        ? Number(
            hexToDecimal(currentConfirmation.txParams.maxPriorityFeePerGas),
          )
        : 0;

      setMaxFeePerGas(newMaxFeePerGas);
      setMaxPriorityFeePerGas(newMaxPriorityFeePerGas);
    }, [currentConfirmation]);

    return { maxFeePerGas, maxPriorityFeePerGas };
  };

  console.log({ currentConfirmation });

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(currentConfirmation);

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

          <EditGasIcon
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

const EditGasIcon = ({
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
