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

interface Loading {
  type: 'Loading';
}
interface Success {
  type: 'Success';
}
interface Error {
  type: 'Error';
  message: string;
}

type ViewState = Loading | Error | Success;

const CreateSnapAccount = () => {
  const [viewState, setViewState] = useState<ViewState | undefined>(undefined);
  const [accountName, setAccountName] = useState('');
  const t = useI18nContext();

  const onConfirm = useCallback(() => {
    console.log('SNAPS/ onConfirm');
    setViewState({ type: 'Loading' });
  }, []);

  const onCancel = useCallback(() => {
    console.log('SNAPS/ onCancel');
    const err = new Error('User cancelled');
    setViewState({ type: 'Error', message: err.message });
  }, []);

  const onAccountNameChange = useCallback((value) => {
    setAccountName(value);
  }, []);

  const snapId = 'npm:@metamask/snap-simple-keyring-snap';
  const snapName = 'Simple Keyring Snap';

  const renderContent = () => {
    switch (viewState?.type) {
      case 'Loading':
        return (
          <Box display={Display.Flex} justifyContent={JustifyContent.center}>
            <PulseLoader />
          </Box>
        );
      case 'Error':
        return (
          <InstallError
            iconName={IconName.Warning}
            title="Account not created"
            description={
              'Something went wrong, so your Snap account wasn’t created yet. Try again later.'
            }
            error={viewState.message}
          />
        );
      case 'Success':
        return null;
      default:
        return (
          <CreateSnapAccountContent
            snapName={snapName}
            snapId={snapId}
            accountName={accountName}
            onAccountNameChange={onAccountNameChange}
          />
        );
    }
  };

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
        <Box>{renderContent()}</Box>
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
