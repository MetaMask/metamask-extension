import {
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  MemoryRouter,
  Route,
  Switch,
  useHistory,
  useLocation,
} from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import {
  getEditedNetwork,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import { hideModal } from '../../../store/actions';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader
} from '../../component-library';
import { Tab, Tabs } from '../../ui/tabs';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { AddNetwork } from './components/add-network';
import { CustomNetworks } from './components/custom-networks';
import { DefaultNetworks } from './components/default-networks';
import { TestNetworks } from './components/test-networks';

export type NetworkItemProps = {
  name: string;
  src: string;
  balance?: string;
  isChecked?: boolean;
  onCheckboxChange?: () => void;
  onMoreOptionsClick?: () => void;
};

// Main network list component
const NetworkList = () => {
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);
  return (
    <>
      <ModalHeader onBack={handleClose} onClose={handleClose}>Networks</ModalHeader>
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
          <CustomNetworks />
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
  const location = useLocation();

  const handleNewNetwork = () => {
    history.push('/add');
  };

  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};

  const editedNetwork = useMemo((): UpdateNetworkFields | undefined => {
    if (location.pathname === '/add') {
      return undefined;
    }
    return !editingChainId || editCompleted
      ? undefined
      : Object.entries(evmNetworks).find(
          ([chainId]) => chainId === editingChainId,
        )?.[1];
  }, [editingChainId, editCompleted, evmNetworks, location.pathname]);

  const networkFormState = useNetworkFormState(editedNetwork);

  console.log(`editedNetwork`, editedNetwork);

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
    (onComplete?: () => void) => {
      return (url: string) => {
        console.log(`networkFormState`, networkFormState);
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
          onComplete?.();
        }
      };
    },
    [networkFormState, history],
  );

  const handleClose = () => {
    history.push('/');
  };

  const handleGoHome = () => {
    history.push('/');
  };

  const handleEditOnComplete = useCallback(() => {
    history.push('/edit');
  }, [history]);

  const handleAddOnComplete = useCallback(() => {
    history.push('/add');
  }, [history]);

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
        <AddBlockExplorerModal onAdded={handleAddExplorerUrl(handleAddOnComplete)} />
      </Route>
      <Route path="/edit-explorer-url">
        <ModalHeader onClose={handleClose} onBack={handleNewNetwork}>
          {t('addBlockExplorerUrl')}
        </ModalHeader>
        <AddBlockExplorerModal onAdded={handleAddExplorerUrl(handleEditOnComplete)} />
      </Route>
      <Route path="/add">
        <ModalHeader onClose={handleClose} onBack={handleGoHome}>
          {t('addNetwork')}{' '}
          {history.location.pathname.includes('add')
            ? 'Custom Network'
            : 'Test Network'}
        </ModalHeader>
        <AddNetwork
          networkFormState={networkFormState}
          network={editedNetwork as UpdateNetworkFields}
          networkType={location.pathname.includes('add') ? 'custom' : 'test'}
        />
      </Route>
      <Route path="/edit">
        <ModalHeader onClose={handleClose} onBack={handleGoHome}>
          {t('editNetwork')}
        </ModalHeader>
        <AddNetwork
          networkFormState={networkFormState}
          network={editedNetwork as UpdateNetworkFields}
          isEdit={true}
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
