import React from 'react';
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { RemoveSnapAccountContent } from './components';

export interface RemoveSnapAccountProps {
  snapId: string;
  snapName: string;
  publicAddress: string;
}

const RemoveSnapAccount = ({
  snapId,
  snapName,
  publicAddress,
}: RemoveSnapAccountProps) => {
  return (
    <Box
      className="remove-snap-account-page"
      height={BlockSize.Full}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      paddingBottom={4}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        height={BlockSize.Full}
      >
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          height={BlockSize.Full}
        >
          <RemoveSnapAccountContent
            snapName={snapName}
            snapId={snapId}
            publicAddress={publicAddress}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default RemoveSnapAccount;
