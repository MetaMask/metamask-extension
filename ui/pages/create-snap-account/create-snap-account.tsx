import React, { useCallback, useState } from 'react';
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
import SnapAuthorshipHeader from '../../components/app/snaps/snap-authorship-header';
import { CreateSnapAccountContent } from './components';

interface CreateSnapAccountProps {
  snapId: string;
  snapName: string;
  onAccountNameChange: (value: string) => void;
}

const CreateSnapAccount = ({
  snapId,
  snapName,
  onAccountNameChange,
}: CreateSnapAccountProps) => {
  const [accountName, setAccountName] = useState('');

  const handleAccountNameChange = useCallback(
    (value) => {
      console.log('---- New Value', value);
      setAccountName(value);
      onAccountNameChange(value);
    },
    [onAccountNameChange, setAccountName],
  );

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
        justifyContent={JustifyContent.spaceBetween}
        height={BlockSize.Full}
      >
        <SnapAuthorshipHeader snapId={snapId} />
        <Box>
          <CreateSnapAccountContent
            snapName={snapName}
            snapId={snapId}
            accountName={accountName}
            onAccountNameChange={handleAccountNameChange}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
