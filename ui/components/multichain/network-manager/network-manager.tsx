import {
  type NetworkConfiguration,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useNetworkFormState } from '../../../pages/settings/networks-tab/networks-form/networks-form-state';
import {
  getEditedNetwork,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import { hideModal, setEditedNetwork } from '../../../store/actions';
import {
  Modal,
  ModalContent,
  ModalContentSize,
  ModalHeader,
} from '../../component-library';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from '../network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { AddNetwork } from './components/add-network';
import { NetworkTabs } from './network-tabs';
import { useNetworkManagerInitialTab } from './hooks/useNetworkManagerState';

export const NetworkManager = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') ?? '';

  const { initialTab } = useNetworkManagerInitialTab();
  const handleNewNetwork = () => {
    setSearchParams({ view: 'add' });
  };

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const { chainId: editingChainId, editCompleted } =
    useSelector(getEditedNetwork) ?? {};

  const editedNetwork = useMemo((): UpdateNetworkFields | undefined => {
    if (view === 'add') {
      return undefined;
    }
    if (view === 'select-rpc') {
      return editingChainId
        ? evmNetworks[editingChainId as keyof typeof evmNetworks]
        : undefined;
    }
    return !editingChainId || editCompleted
      ? undefined
      : Object.entries(evmNetworks).find(
          ([chainId]) => chainId === editingChainId,
        )?.[1];
  }, [editingChainId, editCompleted, evmNetworks, view]);

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

        if (view === 'edit-rpc') {
          setSearchParams({ view: 'edit' });
        } else {
          setSearchParams({ view: 'add' });
        }
      }
    },
    [setSearchParams, networkFormState, view],
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
          if (view === 'edit-explorer-url') {
            setSearchParams({ view: 'edit' });
          } else {
            setSearchParams({ view: 'add' });
          }
          onComplete?.();
        }
      };
    },
    [networkFormState, setSearchParams, view],
  );

  const handleClose = () => {
    dispatch(hideModal());
    dispatch(setEditedNetwork());
    navigate(DEFAULT_ROUTE);
  };

  const handleGoHome = () => {
    setSearchParams({});
  };

  const handleEditOnComplete = useCallback(() => {
    setSearchParams({ view: 'edit' });
  }, [setSearchParams]);

  const handleAddOnComplete = useCallback(() => {
    setSearchParams({ view: 'add' });
  }, [setSearchParams]);

  return (
    <Modal
      isOpen
      onClose={handleClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
    >
      <ModalContent size={ModalContentSize.Md}>
        {view === '' && <NetworkTabs initialTab={initialTab} />}
        {view === 'add' && (
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
        )}
        {view === 'add-rpc' && (
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
        )}
        {view === 'edit-rpc' && (
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
        )}
        {view === 'add-explorer-url' && (
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
        )}
        {view === 'edit-explorer-url' && (
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
        )}
        {view === 'edit' && (
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
        )}
        {view === 'select-rpc' && (
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
            <SelectRpcUrlModal
              networkConfiguration={editedNetwork as NetworkConfiguration}
              onNetworkChange={handleClose}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
