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
import { CreateSnapAccountContent } from './components';

export interface CreateSnapAccountProps {
  snapId: string;
  snapName: string;
}

const CreateSnapAccount = ({ snapId, snapName }: CreateSnapAccountProps) => {
  return (
    <Box
      className="create-snap-account-page"
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
        justifyContent={JustifyContent.center}
        height={BlockSize.Full}
      >
        <CreateSnapAccountContent snapName={snapName} snapId={snapId} />
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
