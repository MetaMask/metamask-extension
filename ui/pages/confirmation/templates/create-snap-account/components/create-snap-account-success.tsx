import React from 'react';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  IconColor,
  JustifyContent,
  TextAlign,
  TextVariant,
  FlexDirection,
  Display,
} from '../../../../../helpers/constants/design-system';
import {
  Text,
  AvatarIcon,
  Box,
  IconName,
  AvatarIconSize,
} from '../../../../../components/component-library';

const CreateSnapAccountSuccess = () => {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BlockSize.Full}
      padding={2}
    >
      <AvatarIcon
        iconName={IconName.Check}
        backgroundColor={BackgroundColor.successMuted}
        size={AvatarIconSize.Xl}
        marginBottom={4}
        iconProps={{ name: IconName.Check, color: IconColor.successDefault }}
      />
      <Text variant={TextVariant.headingLg}>Your account is ready!</Text>
      <Text textAlign={TextAlign.Center}>
        You can find your Snap account in your wallet
      </Text>
    </Box>
  );
};

export default CreateSnapAccountSuccess;
