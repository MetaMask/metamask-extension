import {
  type NetworkConfiguration,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useNetworkFormState } from '../settings/networks-tab/networks-form/networks-form-state';
import { setActiveNetwork, setEditedNetwork } from '../../store/actions';
import AddBlockExplorerModal from '../../components/multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import { SelectRpcUrlModal } from '../../components/multichain/network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { AddNetwork } from '../../components/multichain/network-manager/components/add-network';
import { Header } from '../../components/multichain/pages/page';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { getMultichainNetworkConfigurationsByChainId } from '../../selectors/multichain/networks';
import { getEditedNetwork } from '../../selectors/selectors';
import { SettingsV2Header } from '../settings-v2/shared/settings-v2-header';
import { AddRpcUrlPageForm } from './add-rpc-url-page-form';
import { NetworksPageList } from './networks-page-list';

const getViewAfterRpcAdd = (view: string) =>
  view === 'edit-rpc' ? 'edit' : 'add';

const getViewAfterExplorerAdd = (view: string) =>
  view === 'edit-explorer-url' ? 'edit' : 'add';

const NetworksPageFormHeader = ({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack: () => void;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Header
      startAccessory={
        <ButtonIcon
          ariaLabel={t('back')}
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Md}
          onClick={onBack}
          data-testid="networks-page-form-back-button"
        />
      }
      endAccessory={
        <ButtonIcon
          ariaLabel={t('close')}
          iconName={IconName.Close}
          size={ButtonIconSize.Md}
          onClick={onClose}
          data-testid="networks-page-form-close-button"
        />
      }
      marginBottom={0}
    >
      {title}
    </Header>
  );
};

const NetworksPageFormBody = ({ children }: { children: React.ReactNode }) => (
  <Box flexDirection={BoxFlexDirection.Column} className="min-h-0 flex-1">
    {children}
  </Box>
);

export const NetworksPage = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const view = searchParams.get('view') ?? '';

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

  const setView = useCallback(
    (nextView?: string) => {
      if (nextView) {
        setSearchParams({ view: nextView });
      } else {
        setSearchParams({});
      }
    },
    [setSearchParams],
  );

  const handleNewNetwork = useCallback(() => {
    setView('add');
  }, [setView]);

  const handleAddRPC = useCallback(
    (url: string, name?: string) => {
      if (
        networkFormState.rpcUrls.rpcEndpoints?.every(
          (endpoint) => !URI.equal(endpoint.url, url),
        )
      ) {
        networkFormState.setRpcUrls({
          rpcEndpoints: [
            ...networkFormState.rpcUrls.rpcEndpoints,
            { url, name, type: RpcEndpointType.Custom },
          ],
          defaultRpcEndpointIndex: networkFormState.rpcUrls.rpcEndpoints.length,
        });

        setView(getViewAfterRpcAdd(view));
      }
    },
    [networkFormState, setView, view],
  );

  const handleAddExplorerUrl = useCallback(
    (onComplete?: () => void) => {
      return (url: string) => {
        if (
          networkFormState.blockExplorers.blockExplorerUrls?.every(
            (existingUrl) => existingUrl !== url,
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
          setView(getViewAfterExplorerAdd(view));
          onComplete?.();
        }
      };
    },
    [networkFormState, setView, view],
  );

  const handleClose = useCallback(() => {
    dispatch(setEditedNetwork());
    navigate(DEFAULT_ROUTE);
  }, [dispatch, navigate]);

  // The select-rpc page already updates the network configuration. We only
  // need to point the active network at the chosen RPC client before closing.
  const handleSelectRpc = useCallback(
    (_chainId: string, networkClientId: string) => {
      dispatch(setActiveNetwork(networkClientId));
      handleClose();
    },
    [dispatch, handleClose],
  );

  const handleGoHome = useCallback(() => {
    setView();
  }, [setView]);

  const handleEditOnComplete = useCallback(() => {
    setView('edit');
  }, [setView]);

  const handleAddOnComplete = useCallback(() => {
    setView('add');
  }, [setView]);

  const handleRootBack = useCallback(() => {
    navigate(
      searchParams.get('drawerOpen') === 'true'
        ? `${DEFAULT_ROUTE}?drawerOpen=true`
        : DEFAULT_ROUTE,
    );
  }, [navigate, searchParams]);

  return (
    <Box className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background-default">
      {view === '' ? (
        <>
          <SettingsV2Header
            title={t('networks')}
            onClose={handleRootBack}
            isSearchOpen={isSearchOpen}
            onOpenSearch={() => setIsSearchOpen(true)}
            onCloseSearch={() => setIsSearchOpen(false)}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchClear={() => setSearchValue('')}
            showSearchBorder={false}
          />
          <NetworksPageList searchQuery={searchValue} />
        </>
      ) : null}
      {view === 'add' ? (
        <>
          <NetworksPageFormHeader
            title={t('addNetwork')}
            onBack={handleGoHome}
            onClose={handleClose}
          />
          <AddNetwork
            networkFormState={networkFormState}
            network={editedNetwork as UpdateNetworkFields}
          />
        </>
      ) : null}
      {view === 'add-rpc' ? (
        <>
          <NetworksPageFormHeader
            title={t('addRpcUrl')}
            onBack={handleNewNetwork}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <AddRpcUrlPageForm
              onCancel={handleNewNetwork}
              onAdded={handleAddRPC}
            />
          </NetworksPageFormBody>
        </>
      ) : null}
      {view === 'edit-rpc' ? (
        <>
          <NetworksPageFormHeader
            title={t('addRpcUrl')}
            onBack={handleEditOnComplete}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <AddRpcUrlPageForm
              onCancel={handleEditOnComplete}
              onAdded={handleAddRPC}
            />
          </NetworksPageFormBody>
        </>
      ) : null}
      {view === 'add-explorer-url' ? (
        <>
          <NetworksPageFormHeader
            title={t('addBlockExplorerUrl')}
            onBack={handleNewNetwork}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <AddBlockExplorerModal
              onAdded={handleAddExplorerUrl(handleAddOnComplete)}
            />
          </NetworksPageFormBody>
        </>
      ) : null}
      {view === 'edit-explorer-url' ? (
        <>
          <NetworksPageFormHeader
            title={t('addBlockExplorerUrl')}
            onBack={handleNewNetwork}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <AddBlockExplorerModal
              onAdded={handleAddExplorerUrl(handleEditOnComplete)}
            />
          </NetworksPageFormBody>
        </>
      ) : null}
      {view === 'edit' ? (
        <>
          <NetworksPageFormHeader
            title={t('editNetwork')}
            onBack={handleGoHome}
            onClose={handleClose}
          />
          <AddNetwork
            networkFormState={networkFormState}
            network={editedNetwork as UpdateNetworkFields}
            isEdit={true}
          />
        </>
      ) : null}
      {view === 'select-rpc' ? (
        <>
          <NetworksPageFormHeader
            title={t('selectRpcUrl')}
            onBack={handleGoHome}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <SelectRpcUrlModal
              networkConfiguration={editedNetwork as NetworkConfiguration}
              onNetworkChange={handleSelectRpc}
            />
          </NetworksPageFormBody>
        </>
      ) : null}
    </Box>
  );
};

export default NetworksPage;
