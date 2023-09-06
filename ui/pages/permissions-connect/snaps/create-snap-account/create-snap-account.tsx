import React, { useCallback, useState } from 'react';
import { Box, IconName } from '../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderStyle,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { PageContainerFooter } from '../../../../components/ui/page-container';
import SnapAuthorshipHeader from '../../../../components/app/snaps/snap-authorship-header';
import PulseLoader from '../../../../components/ui/pulse-loader';
import InstallError from '../../../../components/app/snaps/install-error/install-error';
import { CreateSnapAccountContent } from './components';

const CreateSnapAccount = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<undefined | Error>(undefined);
  const [accountName, setAccountName] = useState('');
  const t = useI18nContext();

  const onConfirm = useCallback(() => {
    console.log('SNAPS/ onConfirm');
    setIsLoading(true);
  }, []);

  const onCancel = useCallback(() => {
    console.log('SNAPS/ onCancel');
    const err = new Error('User cancelled');
    setError(err);
    setIsLoading(false);
  }, []);

  const onAccountNameChange = useCallback((value) => {
    setAccountName(value);
  }, []);

  const snapId = 'npm:@metamask/snap-simple-keyring-snap';
  const snapName = 'Simple Keyring Snap';

  return (
    <Box
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
          {isLoading && (
            <Box display={Display.Flex} justifyContent={JustifyContent.center}>
              <PulseLoader />
            </Box>
          )}
          {error && (
            <InstallError
              iconName={IconName.Warning}
              title="Account not created"
              description={
                'Something went wrong, so your Snap account wasn’t created yet. Try again later.'
              }
              error={error.message}
            />
          )}
          {!error && !isLoading && (
            <CreateSnapAccountContent
              snapName={snapName}
              snapId={snapId}
              accountName={accountName}
              onAccountNameChange={onAccountNameChange}
            />
          )}
        </Box>
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={false}
          disabled={false}
          onCancel={onCancel}
          cancelText={t('cancel')}
          onSubmit={onConfirm}
          submitText={t('create')}
        />
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
