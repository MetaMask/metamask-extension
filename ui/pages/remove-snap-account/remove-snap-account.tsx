import React from 'react';
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';
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
      paddingBottom={2}
      paddingTop={2}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        height={BlockSize.Full}
      >
        <RemoveSnapAccountContent
          snapName={snapName}
          snapId={snapId}
          publicAddress={toChecksumHexAddress(publicAddress)}
        />
      </Box>
    </Box>
  );
};

export default RemoveSnapAccount;
