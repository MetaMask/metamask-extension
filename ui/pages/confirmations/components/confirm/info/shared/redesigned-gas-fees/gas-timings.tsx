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
import { useI18nContext } from '../../../../../../../hooks/useI18nContext';
import GasTiming from '../../../../gas-timing';

export const GasTimings = ({
  maxFeePerGas,
  maxPriorityFeePerGas,
}: {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
}) => {
  const t = useI18nContext();

  return (
    <ConfirmInfoRow label={t('speed')} variant={ConfirmInfoRowVariant.Default}>
      <Box display={Display.Flex} alignItems={AlignItems.center}>
        {/* TODO: Confirm if there's bug in the gas timing component for L2 transactions */}
        <GasTiming
          maxFeePerGas={maxFeePerGas}
          maxPriorityFeePerGas={maxPriorityFeePerGas}
        />
      </Box>
    </ConfirmInfoRow>
  );
};
