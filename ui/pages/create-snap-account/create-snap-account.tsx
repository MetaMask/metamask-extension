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

interface CreateSnapAccountProps {
  snapId: string;
  snapName: string;
  onAccountNameChange: (value: string) => void;
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
      padding={[0, 4]}
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
          <CreateSnapAccountContent snapName={snapName} snapId={snapId} />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
