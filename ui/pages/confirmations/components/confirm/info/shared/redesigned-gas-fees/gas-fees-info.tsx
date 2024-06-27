import React, { Dispatch, SetStateAction } from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
} from '../../../../../../../helpers/constants/design-system';
import GasTiming from '../../../../gas-timing';
import { EditGasIconButton } from '../edit-gas-icon/edit-gas-icon-button';

const TotalGasFees = ({
  nativeCurrencyFees,
}: {
  nativeCurrencyFees: string | undefined;
}) => {
  return (
    <ConfirmInfoRow
      label="Total"
      variant={ConfirmInfoRowVariant.Default}
      tooltip="total tooltip"
    >
      <Text>{nativeCurrencyFees}</Text>
    </ConfirmInfoRow>
  );
};

const Divider = () => (
  <Box
    borderColor={BorderColor.borderMuted}
    borderWidth={1}
    width={BlockSize.Full}
  />
);

const GasTimings = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}) => {
  return (
    <ConfirmInfoRow label="Gas speed" variant={ConfirmInfoRowVariant.Default}>
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        {/* TODO: Fix bug in the gas timing component after selection is made */}
        <GasTiming
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      </Box>
    </ConfirmInfoRow>
  );
};

const EditGasFeesRow = ({
  currentCurrencyFees,
  nativeCurrencyFees,
  supportsEIP1559,
  setShowCustomizeGasPopover,
}: {
  currentCurrencyFees: string;
  nativeCurrencyFees: string | undefined;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
}) => {
  return (
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

        <EditGasIconButton
          supportsEIP1559={supportsEIP1559}
          setShowCustomizeGasPopover={setShowCustomizeGasPopover}
        />
      </Box>
    </ConfirmInfoRow>
  );
};

export const GasFeeInfo = ({
  currentCurrencyFees,
  nativeCurrencyFees,
  supportsEIP1559,
  setShowCustomizeGasPopover,
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  currentCurrencyFees: string;
  nativeCurrencyFees: string | undefined;
  supportsEIP1559: boolean;
  setShowCustomizeGasPopover: Dispatch<SetStateAction<boolean>>;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}) => {
  return (
    <>
      <EditGasFeesRow
        currentCurrencyFees={currentCurrencyFees}
        nativeCurrencyFees={nativeCurrencyFees}
        supportsEIP1559={supportsEIP1559}
        setShowCustomizeGasPopover={setShowCustomizeGasPopover}
      />
      {supportsEIP1559 && (
        <GasTimings
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      )}
      <Divider />
      <TotalGasFees nativeCurrencyFees={nativeCurrencyFees} />
    </>
  );
};
