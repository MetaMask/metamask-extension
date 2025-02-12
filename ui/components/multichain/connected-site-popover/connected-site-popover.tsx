import React, { useState } from 'react';
import { Box, Popover, PopoverPosition, Text } from '../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type ConnectedSitePopoverProp = {
  title: string;
  valueColor?: TextColor;
  value?: string | null;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement> | null;
  withPopover?: boolean;
  fullValue?: string;
};

export const ConnectedSitePopover: React.FC<ConnectedSitePopoverProp> = ({
  title,
  valueColor,
  value,
  icon,
  buttonAddressValue,
  withPopover,
  fullValue,
  referenceElement,
  isOpen,
}) => {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
      data-test-id="connected-site-popover"
    >
      <Popover
        referenceElement={referenceElement}
        isOpen={isOpen}
        position={PopoverPosition.BottomStart}
        hasArrow
        flip
        backgroundColor={BackgroundColor.overlayAlternative}
        className="tokenId-popover"
        paddingLeft={4}
        paddingRight={4}
      >
        <Box>Nidhi K Jha</Box>
      </Popover>
    </Box>
  );
};
