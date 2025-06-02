import {
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MemoryRouter, Route, Switch, useHistory } from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import {
  getEditedNetwork,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import {
  ButtonLink,
  ButtonLinkSize,
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
} from '../../component-library';
import { Box } from '../../component-library/box';
import { Tab, Tabs } from '../../ui/tabs';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { AddNetwork } from './components/add-network';
import { DefaultNetworks } from './components/default-networks';
import { EditNetwork } from './components/edit-network';
import { TestNetworks } from './components/test-networks';

export type NetworkItemProps = {
  name: string;
  src: string;
  balance?: string;
  isChecked?: boolean;
  onCheckboxChange?: () => void;
  onMoreOptionsClick?: () => void;
};

// Custom networks list component with routing
const CustomNetworksTab = () => {
  const history = useHistory();

  const handleAddNetwork = () => {
    history.push('/add');
  };

  const handleEditNetwork = (id: string) => {
    history.push(`/edit/${id}`);
  };

  return (
    <Box>
      <div>Custom Networks</div>
      <Box marginTop={2}>
        <ButtonLink size={ButtonLinkSize.Sm} onClick={handleAddNetwork}>
          Add New Network
        </ButtonLink>
      </Box>
      {/* Demo edit button */}
      <Box marginTop={2}>
        <ButtonLink
          size={ButtonLinkSize.Sm}
          onClick={() => handleEditNetwork('demo-network-123')}
        >
          Edit Demo Network
        </ButtonLink>
      </Box>
      <Box marginTop={2}>
        <ButtonLink
          size={ButtonLinkSize.Sm}
          onClick={() => {
            history.push('/add-rpc');
          }}
        >
          Add RPC URL
        </ButtonLink>
      </Box>
    </Box>
  );
};

// Main network list component
const NetworkList = () => {
  return (
    <>
      <ModalHeader>Networks</ModalHeader>
      <Tabs
        defaultActiveTabKey="networks"
        onTabClick={() => {
          // Tab click handler - intentionally empty for now
        }}
        tabListProps={{
          className: 'network-manager__tab-list',
        }}
        padding={4}
      >
        <Tab tabKey="networks" name="Default">
          <DefaultNetworks />
        </Tab>
        <Tab tabKey="networks1" name="Custom">
          <CustomNetworksTab />
        </Tab>
        <Tab tabKey="networks2" name="Test">
          <TestNetworks />
        </Tab>
      </Tabs>
    </>
  );
};

// Router content component
const NetworkManagerRouter = () => {
  const t = useI18nContext();
  const history = useHistory();

  const handleNewNetwork = () => {
    history.push('/add');
  };

  // Get network data and editing state using selectors like in network-list-menu.tsx
  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};

  const editedNetwork = useMemo(
    (): UpdateNetworkFields | undefined =>
      !editingChainId || editCompleted
        ? undefined
        : Object.entries(evmNetworks).find(
            ([chainId]) => chainId === editingChainId,
          )?.[1],
    [editingChainId, editCompleted, evmNetworks],
  );

  const networkFormState = useNetworkFormState(editedNetwork);

  const handleAddRPC = useCallback(
    (url: string, name?: string) => {
      if (
        networkFormState.rpcUrls.rpcEndpoints?.every(
          (e) => !URI.equal(e.url, url),
        )
      ) {
        networkFormState.setRpcUrls({
          rpcEndpoints: [
            ...networkFormState.rpcUrls.rpcEndpoints,
            { url, name, type: RpcEndpointType.Custom },
          ],
          defaultRpcEndpointIndex: networkFormState.rpcUrls.rpcEndpoints.length,
        });
        history.push('/add');
      }
    },
    [networkFormState],
  );

  const handleAddExplorerUrl = useCallback(
    (url: string) => {
      if (
        networkFormState.blockExplorers.blockExplorerUrls?.every(
          (u) => u !== url,
        )
      ) {
        networkFormState.setBlockExplorers({
          blockExplorerUrls: [
            ...networkFormState.blockExplorers.blockExplorerUrls,
            url,
          ],
          defaultBlockExplorerUrlIndex:
            networkFormState.blockExplorers.blockExplorerUrls.length,
        });
        history.push('/add');
      }
    },
    [networkFormState],
  );

  const handleClose = () => {
    history.push('/');
  };

  const handleGoHome = () => {
    history.push('/');
  };

  return (
    <Switch>
      <Route path="/add-rpc">
        <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
          {t('addRpcUrl')}
        </ModalHeader>
        <AddRpcUrlModal onAdded={handleAddRPC} />
      </Route>
      <Route path="/add-explorer-url">
        <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
          {t('addBlockExplorerUrl')}
        </ModalHeader>
        <AddBlockExplorerModal onAdded={handleAddExplorerUrl} />
      </Route>
      <Route path="/add">
        <ModalHeader onClose={handleClose} onBack={handleGoHome}>
          {t('addNetwork')} {history.location.pathname.includes('add')
            ? 'Custom Network'
            : 'Test Network'}
        </ModalHeader>
        <AddNetwork
          networkFormState={networkFormState}
          network={editedNetwork as UpdateNetworkFields}
          networkType={
            history.location.pathname.includes('add') ? 'custom' : 'test'
          }
        />
      </Route>
      <Route path="/edit">
        <ModalHeader onClose={handleClose} onBack={handleGoHome}>
          {t('editNetwork')}
        </ModalHeader>
        <AddNetwork
          networkFormState={networkFormState}
          network={editedNetwork as UpdateNetworkFields}
        />
      </Route>
      <Route path="/">
        <NetworkList />
      </Route>
    </Switch>
  );
};

export const NetworkManager = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal isOpen onClose={onClose}>
      <ModalContent size={ModalContentSize.Md}>
        <MemoryRouter initialEntries={['/']}>
          <NetworkManagerRouter />
        </MemoryRouter>
      </ModalContent>
    </Modal>
  );
};
