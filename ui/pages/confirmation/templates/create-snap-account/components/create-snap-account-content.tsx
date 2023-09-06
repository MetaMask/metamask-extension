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
import { useI18nContext } from '../../../../../hooks/useI18nContext';

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
  const t = useI18nContext();

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
          {t('createSnapAccount')}
        </Text>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Center}
          padding={[0, 4]}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('createSnapAccountDescription', [snapName])}
        </Text>
      </Box>
      <Box paddingTop={4} paddingLeft={4} paddingRight={4} paddingBottom={2}>
        <Text
          variant={TextVariant.bodyMd}
          textAlign={TextAlign.Left}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('accountName')}
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
