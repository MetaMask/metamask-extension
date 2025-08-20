import React from 'react';
import { Box, IconSize } from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import HollowCircle from './hollow-circle';

/**
 * Renders the steps in the Bridge Transaction Details page
 *
 * @param options
 * @param options.iconSize - The size of the icon
 * @param options.color - The color of the icon
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PulsingCircle({
  iconSize,
  color,
}: {
  iconSize: IconSize;
  color: IconColor;
}) {
  return (
    <Box style={{ position: 'relative' }}>
      <Box
        className="bridge-transaction-details__icon-loading" // Needed for animation
        backgroundColor={BackgroundColor.primaryMuted}
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.full}
        style={{ width: '2rem', height: '2rem' }}
      ></Box>
      <HollowCircle
        size={iconSize}
        color={color}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          borderWidth: '2px',
        }}
      />
    </Box>
  );
}
