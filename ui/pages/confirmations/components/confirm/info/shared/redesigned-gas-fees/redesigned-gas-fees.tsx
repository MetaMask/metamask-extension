import { TransactionMeta } from '@metamask/transaction-controller';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EtherDenomination } from '../../../../../../../../shared/constants/common';
import { EditGasModes } from '../../../../../../../../shared/constants/gas';
import {
  addHexes,
  getEthConversionFromWeiHex,
  getValueFromWeiHex,
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
import { getConversionRate } from '../../../../../../../ducks/metamask/metamask';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useFiatFormatter } from '../../../../../../../hooks/useFiatFormatter';
import {
  currentConfirmationSelector,
  getCurrentCurrency,
} from '../../../../../../../selectors';
import AdvancedGasFeePopover from '../../../../advanced-gas-fee-popover';
import EditGasFeePopover from '../../../../edit-gas-fee-popover';
import EditGasPopover from '../../../../edit-gas-popover';
import GasTiming from '../../../../gas-timing';
import { useSupportsEIP1559 } from '../../hooks/supports-eip-1559';
import { useEIP1559TxFees } from '../../hooks/use-eip-1559-fees';
import { EditGasIcon } from '../edit-gas-icon/edit-gas-icon';

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
        conversionRate,
        fromCurrency: EtherDenomination.GWEI,
        toCurrency: currentCurrency,
        numberOfDecimals: 2,
      }),
    ),
  );

  const { maxFeePerGas, maxPriorityFeePerGas } =
    useEIP1559TxFees(currentConfirmation);

  // Layer 2 fees breakdown

  const layer1GasFee = currentConfirmation?.layer1GasFee ?? null;
  const hasLayer1GasFee = layer1GasFee !== null;
  const [expandFeeDetails, setExpandFeeDetails] = useState(false);

  // L1
  const nativeCurrencyL1Fees = layer1GasFee
    ? getEthConversionFromWeiHex({
        value: layer1GasFee,
        fromCurrency: EtherDenomination.GWEI,
        numberOfDecimals: 4,
      })
    : null;

  const currentCurrencyL1Fees = layer1GasFee
    ? fiatFormatter(
        Number(
          getValueFromWeiHex({
            value: layer1GasFee,
            conversionRate,
            fromCurrency: EtherDenomination.GWEI,
            toCurrency: currentCurrency,
            numberOfDecimals: 2,
          }),
        ),
      )
    : null;

  // Total
  const getTransactionFeeTotal = useMemo(() => {
    return addHexes(gasEstimate, (layer1GasFee as string) ?? 0);
  }, [gasEstimate, layer1GasFee]);

  const nativeCurrencyTotalFees = layer1GasFee
    ? getEthConversionFromWeiHex({
        value: getTransactionFeeTotal,
        fromCurrency: EtherDenomination.GWEI,
        numberOfDecimals: 4,
      })
    : null;

  const currentCurrencyTotalFees = layer1GasFee
    ? fiatFormatter(
        Number(
          getValueFromWeiHex({
            value: getTransactionFeeTotal,
            conversionRate,
            fromCurrency: EtherDenomination.GWEI,
            toCurrency: currentCurrency,
            numberOfDecimals: 2,
          }),
        ),
      )
    : null;

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
              maxFeePerGas={String(maxFeePerGas)}
              maxPriorityFeePerGas={String(maxPriorityFeePerGas)}
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

      {/* L2 Fees Breakdown */}

      {hasLayer1GasFee && (
        <Box
          padding={4}
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
          <Button
            style={{ textDecoration: 'none' }}
            size={ButtonSize.Sm}
            variant={ButtonVariant.Link}
            endIconName={
              expandFeeDetails ? IconName.ArrowUp : IconName.ArrowDown
            }
            color={IconColor.primaryDefault}
            data-testid="expand-fee-details-button"
            onClick={() => setExpandFeeDetails(!expandFeeDetails)}
          >
            <Text variant={TextVariant.bodySm} color={IconColor.primaryDefault}>
              {'feeDetails'}
            </Text>
          </Button>
        </Box>
      )}

      {hasLayer1GasFee && expandFeeDetails && (
        <>
          <ConfirmInfoRow
            label="L2 Fees"
            variant={ConfirmInfoRowVariant.Default}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Center}
              style={{ flexGrow: '1' }}
              marginLeft={8}
            >
              <Text color={TextColor.textAlternative}>
                {currentCurrencyFees}
              </Text>
              <Text color={TextColor.textAlternative}>
                {nativeCurrencyFees}
              </Text>
            </Box>
          </ConfirmInfoRow>

          <ConfirmInfoRow
            label="L1 Fees"
            variant={ConfirmInfoRowVariant.Default}
          >
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Center}
              style={{ flexGrow: '1' }}
              marginLeft={8}
            >
              <Text color={TextColor.textAlternative}>
                {currentCurrencyL1Fees}
              </Text>
              <Text color={TextColor.textAlternative}>
                {nativeCurrencyL1Fees}
              </Text>
            </Box>
          </ConfirmInfoRow>

          <ConfirmInfoRow label="Total" variant={ConfirmInfoRowVariant.Default}>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Row}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              textAlign={TextAlign.Center}
              style={{ flexGrow: '1' }}
              marginLeft={8}
            >
              <Text color={TextColor.textAlternative}>
                {currentCurrencyTotalFees}
              </Text>
              <Text color={TextColor.textAlternative}>
                {nativeCurrencyTotalFees}
              </Text>
            </Box>
          </ConfirmInfoRow>
        </>
      )}

      {/* Modals */}
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
