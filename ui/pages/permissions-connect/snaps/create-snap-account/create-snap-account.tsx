import React, { useCallback, useState } from 'react';
import {
  Box,
  IconSize,
  Text,
  TextField,
} from '../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  BorderStyle,
  FlexDirection,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import SnapAvatar from '../../../../components/app/snaps/snap-avatar';

const CreateSnapAccount = () => {
  const [accountName, setAccountName] = useState('');
  const t = useI18nContext();

  const onConfirm = useCallback(() => {
    console.log('SNAPS/ onconfirm');
  }, []);

  const onCancel = useCallback(() => {
    console.log('SNAPS/ onconfirm');
  }, []);

  const onAccountNameChange = useCallback((value) => {
    setAccountName(value);
  }, []);

  const snapId = 'npm:@metamask/snap-simple-keyring-snap';
  const snapName = 'Simple Keyring Snap';

  return (
    <Box
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      borderStyle={BorderStyle.none}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      padding={[0, 4]}
    >
      <Box
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        paddingLeft={4}
        paddingRight={4}
        paddingBottom={2}
      >
        <SnapAuthorshipHeader snapId={snapId} />
      </Box>
      <Text textAlign={TextAlign.Center} variant={TextVariant.headingLg}>
        Create Snap Account
      </Text>
      <Box alignItems={AlignItems.center} paddingBottom={2}>
        <SnapAvatar
          snapId={snapId}
          badgeSize={IconSize.Md}
          avatarSize={IconSize.Xl}
          borderWidth={3}
        />
      </Box>
      <Text
        variant={TextVariant.bodyMd}
        textAlign={TextAlign.Center}
        padding={[0, 4]}
        overflowWrap={OverflowWrap.Anywhere}
      >
        {`${snapName} wants to add a new snap account to your wallet`}
      </Text>
      <Box paddingLeft={4} paddingRight={4} paddingBottom={2}>
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
            const newAccountName = event.clipboardData.getData('text');
            if (newAccountName) {
              onAccountNameChange(newAccountName);
            }
          }}
        />
      </Box>
      <PageContainerFooter
        footerClassName="snaps-connect__footer"
        cancelButtonType="default"
        hideCancel={false}
        disabled={false}
        onCancel={onCancel}
        cancelText={t('cancel')}
        onSubmit={onConfirm}
        submitText={t('create')}
      />
    </Box>
  );
};

export default CreateSnapAccount;
