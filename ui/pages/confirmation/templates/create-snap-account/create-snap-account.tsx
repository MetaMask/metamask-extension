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
import {
  CreateSnapAccountContent,
  CreateSnapAccountSuccess,
} from './components';

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

interface CreateSnapAccountProps {
  onCancel: () => Promise<void>;
  onSubmit: (accountName: string) => Promise<void>;
  snapId: string;
  snapName: string;
}

const CreateSnapAccount = ({
  onCancel,
  onSubmit,
  snapId,
  snapName,
}: CreateSnapAccountProps) => {
  const [viewState, setViewState] = useState<ViewState | undefined>(undefined);
  const [accountName, setAccountName] = useState('');
  const t = useI18nContext();

  const handleOnConfirm = useCallback(async () => {
    setViewState({ type: 'Loading' });
    try {
      await onSubmit(accountName);
      setViewState({ type: 'Success' });
    } catch (err) {
      setViewState({ type: 'Error', message: (err as Error).message });
    }
  }, [onSubmit, accountName]);

  const handleOnCancel = useCallback(async () => {
    setViewState({ type: 'Loading' });
    try {
      await onCancel();
      setViewState({ type: 'Success' });
    } catch (err) {
      setViewState({ type: 'Error', message: (err as Error).message });
    }
  }, [onCancel]);

  const onAccountNameChange = useCallback((value) => {
    setAccountName(value);
  }, []);

  const renderContent = () => {
    switch (viewState?.type) {
      case 'Loading':
        return (
          <Box display={Display.Flex} justifyContent={JustifyContent.center}>
            <PulseLoader />
          </Box>
        );
      case 'Error':
        return null;
      // return (
      //   <InstallError
      //     iconName={IconName.Warning}
      //     title={t('accountNotCreated')}
      //     description={t('accountNotCreatedDescription')}
      //     error={viewState.message}
      //   />
      // );
      case 'Success':
        return null;
      // return <CreateSnapAccountSuccess />;
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
        <Box>{renderContent()}</Box>
        <PageContainerFooter
          cancelButtonType="default"
          hideCancel={viewState !== undefined}
          disabled={false}
          onCancel={handleOnCancel}
          cancelText={t('cancel')}
          onSubmit={handleOnConfirm}
          submitText={viewState === undefined ? t('create') : t('gotIt')}
        />
      </Box>
    </Box>
  );
};

export default CreateSnapAccount;
