import React from 'react';
import { Box, Text } from '../../../../components/component-library';
import {
  TextVariant,
  FontWeight,
  TextAlign,
  TextColor,
  BackgroundColor,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

/**
 * A component that displays the current step number and total steps in a setup process.
 *
 * @param props - The component props
 * @param props.currentStep - The current step number in the process
 * @param props.totalSteps - The total number of steps in the process
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function StepIndicator({
  currentStep,
  totalSteps,
}: StepIndicatorProps) {
  return (
    <Box
      marginBottom={2}
      display={Display.Flex}
      justifyContent={JustifyContent.center}
    >
      <Text
        textAlign={TextAlign.Center}
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Medium}
        color={TextColor.infoDefault}
        backgroundColor={BackgroundColor.primaryMuted}
        style={{
          padding: '4px 8px',
          borderRadius: '16px',
          display: 'inline-block',
        }}
      >
        Step {currentStep} of {totalSteps}
      </Text>
    </Box>
  );
}
