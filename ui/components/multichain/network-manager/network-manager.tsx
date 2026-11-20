import {
  ModalContentSize,
  ModalContent,
  Modal,
  ModalHeader,
} from '@metamask/design-system-react';
import {
  type NetworkConfiguration,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useNetworkFormState } from '../networks-form/networks-form-state';
import {
  getEditedNetwork,
  getMultichainNetworkConfigurationsByChainId,
} from '../../../selectors';
import { hideModal, setEditedNetwork } from '../../../store/actions';
import AddBlockExplorerModal from '../network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import AddRpcUrlModal from '../network-list-menu/add-rpc-url-modal/add-rpc-url-modal';
import { SelectRpcUrlModal } from '../network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { useDispatch } from '../../../store/hooks';
import {
  NetworkManagementEntryPoint,
  NetworkManagementSource,
} from '../../../../shared/constants/metametrics';
import {
  trackRpcAdded,
  useTrackNetworkManagementStep,
  getNetworkManagementStep,
} from '../../../helpers/utils/network-management-metrics';
import { getNetworkSectionKey } from '../../../helpers/utils/network-sections';
import { getHexChainId } from '../../../pages/networks/chainlist-network-picker';
import { AddNetwork } from './components/add-network';
import { NetworkTabs } from './network-tabs';
import { useNetworkManagerInitialTab } from './hooks/useNetworkManagerState';

export const NetworkManager = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
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
  const managerStep = getNetworkManagementStep(view);
  const stepChainId = networkFormState.chainId
    ? getHexChainId(networkFormState.chainId)
    : undefined;

  useTrackNetworkManagementStep({
    step: managerStep,
    entryPoint: NetworkManagementEntryPoint.SettingsNetworks,
    chainId: stepChainId,
    rpcCount: networkFormState.rpcUrls.rpcEndpoints.length,
    networkType: stepChainId ? getNetworkSectionKey(stepChainId) : undefined,
  });

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
        trackRpcAdded(
          { trackEvent, createEventBuilder },
          {
            chainId: networkFormState.chainId
              ? getHexChainId(networkFormState.chainId)
              : undefined,
            rpcCount: networkFormState.rpcUrls.rpcEndpoints.length + 1,
            source: NetworkManagementSource.Manual,
            entryPoint: NetworkManagementEntryPoint.SettingsNetworks,
          },
        );

        if (view === 'edit-rpc') {
          setSearchParams({ view: 'edit' });
        } else {
          setSearchParams({ view: 'add' });
        }
      }
    },
    [createEventBuilder, networkFormState, setSearchParams, trackEvent, view],
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

  const handleClose = useCallback(() => {
    dispatch(hideModal());
    dispatch(setEditedNetwork());
    if (view) {
      setSearchParams({});
    }
  }, [dispatch, setSearchParams, view]);

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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
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
                ariaLabel: t('close'),
                'data-testid': 'modal-header-close-button',
              }}
              backButtonProps={{ ariaLabel: t('back') }}
            >
              {t('selectRpcUrl')}
            </ModalHeader>
            <SelectRpcUrlModal
              networkConfiguration={editedNetwork as NetworkConfiguration}
              entryPoint={NetworkManagementEntryPoint.SettingsNetworks}
              onNetworkChange={handleClose}
            />
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
