import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowVariant,
} from '../../../../../../../components/app/confirm/info/row';
import { Box } from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
} from '../../../../../../../helpers/constants/design-system';
import GasTiming from '../../../../gas-timing';

export const GasTimings = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}) => {
  return (
    <ConfirmInfoRow label="Speed" variant={ConfirmInfoRowVariant.Default}>
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        {/* TODO: Fix bug in the gas timing component for L2 transactions */}
        <GasTiming
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      </Box>
    </ConfirmInfoRow>
  );
};
