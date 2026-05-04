import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  RevertInfo,
  RevertReason,
} from '../../../components/revert-reason/revert-reason';

export const GasEstimateFailedAlertMessage = (
  t: (key: string, ...args: unknown[]) => string,
  revert?: RevertInfo,
) => {
  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      <Text
        variant={TextVariant.bodyMd}
        color={TextColor.textDefault}
        data-testid="alert-modal__selected-alert"
      >
        {t('alertMessageGasEstimateFailed')}
      </Text>
      {revert && (
        <RevertReason
          revert={revert}
          data-testid="gas-estimate-failed-revert-reason"
        />
      )}
    </Box>
  );
};
