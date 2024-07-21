import React from 'react';
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
import { getNonTestNetworks } from '../../../../selectors';
import { useI18nContext } from '../../../../hooks/useI18nContext';

type StagedNetworkSettingsProps = {
  networkToEdit2: any;
  isOpen: boolean;
  onClose: (arg: boolean) => void;
  setActionMode: (mode: string) => void;
  stagedRpcUrls: any;
  stagedBlockExplorers: any;
  onRpcUrlSelected: (arg: string) => void;
  onExplorerUrlSelected: (arg: string) => void;
};

const StagedNetworkSettings = ({
  networkToEdit2,
  isOpen,
  onClose,
  setActionMode,
  stagedRpcUrls,
  stagedBlockExplorers,
  onRpcUrlSelected,
  onExplorerUrlSelected,
}: StagedNetworkSettingsProps) => {
  const nonTestNetworks = useSelector(getNonTestNetworks);
  const networkToEdit = (chainId: string) => {
    const network = [...nonTestNetworks].find((n) => n.chainId === chainId);
    return network ? { ...network, label: network.nickname } : undefined;
  };
  const t = useI18nContext();

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
            addNewNetwork={false}
            restrictHeight
            networksToRender={[]}
            selectedNetwork={networkToEdit(networkToEdit2.chainId)}
            stagedRpcUrls={stagedRpcUrls}
            stagedBlockExplorers={stagedBlockExplorers}
            goToPreviousStep={() => {
              setActionMode('list');
              return null;
            }}
            onRpcUrlAdd={() => setActionMode('add_rpc')}
            onBlockExplorerUrlAdd={() => setActionMode('add_block_explorer')}
            onRpcUrlSelected={onRpcUrlSelected}
            onExplorerUrlSelected={onExplorerUrlSelected}
            onBoardingMultiRpc
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default StagedNetworkSettings;
