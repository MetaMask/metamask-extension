import React, { useMemo } from 'react';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  IconName,
} from '../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import NetworksForm from '../../../../pages/settings/networks-tab/networks-form';
import { useSelector } from 'react-redux';
import {
  getNetworkConfigurationsByChainId,
  getNonTestNetworks,
} from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useNetworkFormState } from '../../../../pages/settings/networks-tab/networks-form/networks-form-state';

type StagedNetworkSettingsProps = {
  networkFormState: any;
  editedNetwork: any;
  isOpen: boolean;
  onClose: (arg: boolean) => void;
  setActionMode: (mode: string) => void;
};

const StagedNetworkSettings = ({
  networkFormState,
  editedNetwork,
  isOpen,
  onClose,
  setActionMode,
}: StagedNetworkSettingsProps) => {
  const t = useI18nContext();
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose(true)}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar auto-detect-in-modal"
      data-testid="multi-rpc-edit-modal"
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent
        modalDialogProps={{ className: 'multi-rpc-edit-modal__dialog' }}
      >
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          onBack={() => {
            setActionMode('list');
          }}
          backButtonProps={{
            'data-testid': 'back',
            ariaLabel: '',
            iconName: IconName.ArrowLeft,
          }}
        >
          {t('editNetworkInformation')}
        </ModalHeader>
        <ModalBody display={Display.Flex} flexDirection={FlexDirection.Column}>
          <NetworksForm
            networkFormState={networkFormState}
            existingNetwork={editedNetwork}
            onRpcAdd={() => setActionMode('add_rpc')}
            onBlockExplorerAdd={() => setActionMode('add_block_explorer')}
            isOnBoarding
            onSave={() => {
              setActionMode('list');
            }}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StagedNetworkSettings;
