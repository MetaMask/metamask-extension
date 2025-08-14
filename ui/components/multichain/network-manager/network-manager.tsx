import {
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Route,
  Routes,
  useNavigate,
  useLocation,
} from 'react-router-dom-v5-compat';
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
  ModalHeader,
} from '../../component-library';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from '../network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { AddNetwork } from './components/add-network';
import { NetworkTabs } from './network-tabs';
import { useNetworkManagerState } from './hooks/useNetworkManagerState';

export const NetworkManager = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { initialTab } = useNetworkManagerState();

  const onClose = useCallback(() => {
    dispatch(hideModal());
  }, [dispatch]);

  const handleNewNetwork = () => {
    navigate('/add');
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
    if (location.pathname === '/select-rpc') {
      return evmNetworks[editingChainId as keyof typeof evmNetworks];
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

        if (location.pathname === '/edit-rpc') {
          navigate('/edit');
        } else {
          navigate('/add');
        }
      }
    },
    [navigate, networkFormState, location.pathname],
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
          if (location.pathname === '/edit-explorer-url') {
            navigate('/edit');
          } else {
            navigate('/add');
          }
          onComplete?.();
        }
      };
    },
    [networkFormState, navigate, location.pathname],
  );

  const handleClose = () => {
    dispatch(hideModal());
    navigate('/');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleEditOnComplete = useCallback(() => {
    navigate('/edit');
  }, [navigate]);

  const handleAddOnComplete = useCallback(() => {
    navigate('/add');
  }, [navigate]);

  return (
    <Modal isOpen onClose={onClose} isClosedOnEscapeKey isClosedOnOutsideClick>
      <ModalContent size={ModalContentSize.Md}>
        <Routes>
          <Route
            path="/add"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleGoHome}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('addNetwork')}
                </ModalHeader>
                <AddNetwork
                  networkFormState={networkFormState}
                  network={editedNetwork as UpdateNetworkFields}
                />
              </>
            }
          />
          <Route
            path="/add-rpc"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleNewNetwork}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('addRpcUrl')}
                </ModalHeader>
                <AddRpcUrlModal onAdded={handleAddRPC} />
              </>
            }
          />
          <Route
            path="/edit-rpc"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleEditOnComplete}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('addRpcUrl')}
                </ModalHeader>
                <AddRpcUrlModal onAdded={handleAddRPC} />
              </>
            }
          />
          <Route
            path="/add-explorer-url"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleNewNetwork}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('addBlockExplorerUrl')}
                </ModalHeader>
                <AddBlockExplorerModal
                  onAdded={handleAddExplorerUrl(handleAddOnComplete)}
                />
              </>
            }
          />
          <Route
            path="/edit-explorer-url"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleNewNetwork}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('addBlockExplorerUrl')}
                </ModalHeader>
                <AddBlockExplorerModal
                  onAdded={handleAddExplorerUrl(handleEditOnComplete)}
                />
              </>
            }
          />
          <Route
            path="/edit"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleGoHome}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('editNetwork')}
                </ModalHeader>
                <AddNetwork
                  networkFormState={networkFormState}
                  network={editedNetwork as UpdateNetworkFields}
                  isEdit={true}
                />
              </>
            }
          />
          <Route
            path="/select-rpc"
            element={
              <>
                <ModalHeader
                  onClose={handleClose}
                  onBack={handleGoHome}
                  closeButtonProps={{
                    'data-testid': 'modal-header-close-button',
                  }}
                >
                  {t('selectRpcUrl')}
                </ModalHeader>
                <SelectRpcUrlModal onNetworkChange={handleClose} />
              </>
            }
          />
          <Route path="/" element={<NetworkTabs initialTab={initialTab} />} />
        </Routes>
      </ModalContent>
    </Modal>
  );
};
