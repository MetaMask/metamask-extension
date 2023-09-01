import React from 'react';
import {
  Box,
  IconSize,
  Text,
  TextField,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import SnapAvatar from '../../../../../components/app/snaps/snap-avatar';

interface CreateSnapAccountContentProps {
  snapName: string;
  snapId: string;
  accountName: string;
  onAccountNameChange: (newAccountName: string) => void;
}

const CreateSnapAccountContent = ({
  snapName,
  snapId,
  onAccountNameChange,
  accountName,
}: CreateSnapAccountContentProps) => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
      >
        <Box paddingBottom={2}>
          <SnapAvatar
            snapId={snapId}
            badgeSize={IconSize.Md}
            avatarSize={IconSize.Xl}
            borderWidth={3}
          />
        </Box>
        <Text textAlign={TextAlign.Center} variant={TextVariant.headingLg}>
          Create Snap Account
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          padding={[0, 4]}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {`${snapName} wants to add a new snap account to your wallet`}
        </Text>
      </Box>
      <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={2}>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Left}
          overflowWrap={OverflowWrap.Anywhere}
        >
          Account Name
        </Text>
        <TextField
          id={snapId}
          data-testid={snapId}
          autoFocus
          required
          onChange={(event) => {
            event.preventDefault();
            onAccountNameChange(event.target.value);
          }}
          placeholder={'New Account 1'}
          value={accountName}
          autoComplete="off"
          width={BlockSize.Full}
          onPaste={(event) => {
            const newAccountName: string = event.clipboardData.getData('text');
            if (newAccountName) {
              onAccountNameChange(newAccountName);
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default CreateSnapAccountContent;
