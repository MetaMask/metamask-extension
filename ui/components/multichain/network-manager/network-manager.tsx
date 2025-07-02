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
  getSelectedMultichainNetworkConfiguration,
} from '../../../selectors';
import { hideModal } from '../../../store/actions';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
} from '../../component-library';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { AddNetwork } from './components/add-network';
import { NetworkTabs } from './network-tabs';
import { useNetworkManagerState } from './hooks/useNetworkManagerState';

// Router content component
const NetworkManagerRouter = () => {
  const t = useI18nContext();
  const history = useHistory();
  const location = useLocation();
  const currentMultichainNetwork = useSelector(
    getSelectedMultichainNetworkConfiguration,
  );

  const { isNetworkInDefaultNetworkTab } = useNetworkManagerState();

  const isDefaultNetworkSelected = isNetworkInDefaultNetworkTab(
    currentMultichainNetwork,
  );

  const initialTab = useMemo(() => {
    return isDefaultNetworkSelected ? 'networks' : 'custom-networks';
  }, [isDefaultNetworkSelected]);

  const handleNewNetwork = () => {
    history.push('/add');
  };

  const [, evmNetworks] = useSelector(
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
    [history, networkFormState],
  );

  const handleAddExplorerUrl = useCallback(
    (onComplete?: () => void) => {
      return (url: string) => {
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
        <ModalHeader
          onClose={handleClose}
          onBack={handleNewNetwork}
          closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
        >
          {t('addRpcUrl')}
        </ModalHeader>
        <AddRpcUrlModal onAdded={handleAddRPC} />
      </Route>
      <Route path="/add-explorer-url">
        <ModalHeader
          onClose={handleClose}
          onBack={handleNewNetwork}
          closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
        >
          {t('addBlockExplorerUrl')}
        </ModalHeader>
        <AddBlockExplorerModal
          onAdded={handleAddExplorerUrl(handleAddOnComplete)}
        />
      </Route>
      <Route path="/edit-explorer-url">
        <ModalHeader
          onClose={handleClose}
          onBack={handleNewNetwork}
          closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
        >
          {t('addBlockExplorerUrl')}
        </ModalHeader>
        <AddBlockExplorerModal
          onAdded={handleAddExplorerUrl(handleEditOnComplete)}
        />
      </Route>
      <Route path="/edit">
        <ModalHeader
          onClose={handleClose}
          onBack={handleGoHome}
          closeButtonProps={{ 'data-testid': 'modal-header-close-button' }}
        >
          {t('editNetwork')}
        </ModalHeader>
        <AddNetwork
          networkFormState={networkFormState}
          network={editedNetwork as UpdateNetworkFields}
          isEdit={true}
        />
      </Route>
      <Route path="/">
        <NetworkTabs initialTab={initialTab} />
      </Route>
    </Switch>
  );
};

export const NetworkManager = () => {
  const dispatch = useDispatch();

  const onClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);

  return (
    <Modal isOpen onClose={onClose} isClosedOnEscapeKey isClosedOnOutsideClick>
      <ModalContent size={ModalContentSize.Md}>
        <MemoryRouter initialEntries={['/']}>
          <NetworkManagerRouter />
        </MemoryRouter>
      </ModalContent>
    </Modal>
  );
};
