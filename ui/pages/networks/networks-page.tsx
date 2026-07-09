import {
  type NetworkConfiguration,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import { NETWORKS_BYPASSING_VALIDATION } from '@metamask/controller-utils';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as URI from 'uri-js';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  transitionBack,
  transitionForward,
} from '../../components/ui/transition';
import { useNetworkFormState } from '../../components/multichain/networks-form/networks-form-state';
import { setActiveNetwork, setEditedNetwork } from '../../store/actions';
import AddBlockExplorerModal from '../../components/multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import { SelectRpcUrlModal } from '../../components/multichain/network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { AddNetwork } from '../../components/multichain/network-manager/components/add-network';
import { Header } from '../../components/multichain/pages/page';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { NETWORK_TO_NAME_MAP } from '../../../shared/constants/network';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
} from '../../selectors/multichain/networks';
import { getIsChainlistEnabled } from '../../selectors/multichain/feature-flags';
import { getEditedNetwork } from '../../selectors/selectors';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsHeader } from '../settings/shared/settings-header';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AddRpcUrlPageForm } from './add-rpc-url-page-form';
import {
  ChainlistNetworkPicker,
  getHexChainId,
  getUsableUrls,
  type ChainlistNetwork,
} from './chainlist-network-picker';
import { NetworksPageList } from './networks-page-list';

const getViewAfterRpcAdd = (view: string) =>
  view === 'edit-rpc' ? 'edit' : 'add';

const getViewAfterExplorerAdd = (view: string) =>
  view === 'edit-explorer-url' ? 'edit' : 'add';

const NETWORKS_PAGE_TOAST_DURATION_MS = 5000;

const NETWORKS_PAGE_VIEW_DEPTH: Record<string, number> = {
  '': 0,
  add: 1,
  edit: 1,
  'add-from-chainlist': 2,
  'add-rpc': 2,
  'edit-rpc': 2,
  'add-explorer-url': 2,
  'edit-explorer-url': 2,
  'select-rpc': 2,
};

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
  const { trackEvent, createEventBuilder } = useAnalytics();
  const navigate = useNavigate();
  const runCloseTransition = useGlobalMenuRouteTransition();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const view = searchParams.get('view') ?? '';

  const [, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const currentMultichainChainId = useSelector(
    getSelectedMultichainNetworkChainId,
  );
  const isChainlistEnabled = useSelector(getIsChainlistEnabled);
  const rawEditedNetwork = useSelector(getEditedNetwork);
  const { chainId: editingChainId, editCompleted } = rawEditedNetwork ?? {};

  const editedNetwork = useMemo((): UpdateNetworkFields | undefined => {
    if (view === 'add' || view === 'add-from-chainlist') {
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
  const existingNetworkChainIds = useMemo(
    () =>
      new Set(
        Object.values(evmNetworks).map((network) =>
          network.chainId.toLowerCase(),
        ),
      ),
    [evmNetworks],
  );
  const existingNetworkNamesByChainId = useMemo(
    () =>
      Object.fromEntries(
        Object.values(evmNetworks).map((network) => [
          network.chainId.toLowerCase(),
          network.name,
        ]),
      ),
    [evmNetworks],
  );

  const setView = useCallback(
    (nextView?: string) => {
      const updateView = () => {
        if (nextView) {
          setSearchParams({ view: nextView });
        } else {
          setSearchParams({});
        }
      };
      const currentDepth = NETWORKS_PAGE_VIEW_DEPTH[view] ?? 0;
      const nextDepth = NETWORKS_PAGE_VIEW_DEPTH[nextView ?? ''] ?? 0;

      if (nextDepth > currentDepth) {
        transitionForward(updateView);
        return;
      }

      transitionBack(updateView);
    },
    [setSearchParams, view],
  );

  const handleNewNetwork = useCallback(() => {
    setView('add');
  }, [setView]);

  const handleAddFromChainlist = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ChainlistAddClicked)
        .addCategory(MetaMetricsEventCategory.Network)
        .build(),
    );
    setView('add-from-chainlist');
  }, [createEventBuilder, setView, trackEvent]);

  const handleChainlistNetworkSelect = useCallback(
    (network: ChainlistNetwork, searchQuery?: string) => {
      const chainIdHex = getHexChainId(network.chainId);
      const existingNetwork =
        evmNetworks[chainIdHex as keyof typeof evmNetworks];
      const networkName = existingNetwork?.name ?? network.name;
      /* eslint-disable @typescript-eslint/naming-convention */
      trackEvent(
        createEventBuilder(MetaMetricsEventName.ChainlistNetworkSelected)
          .addCategory(MetaMetricsEventCategory.Network)
          .addProperties({
            chain_id: chainIdHex,
            network_name: networkName,
            already_added: Boolean(existingNetwork),
            ...(searchQuery ? { search_query: searchQuery } : {}),
          })
          .build(),
      );
      /* eslint-enable @typescript-eslint/naming-convention */

      if (existingNetwork) {
        dispatch(
          setEditedNetwork({
            chainId: chainIdHex,
            nickname: existingNetwork.name,
          }),
        );
        setView('edit');
        return;
      }

      const primaryRpcUrl = getUsableUrls(network.rpc)[0];
      const rpcEndpoints = primaryRpcUrl
        ? [{ url: primaryRpcUrl, type: RpcEndpointType.Custom }]
        : [];
      const blockExplorerUrls = getUsableUrls(
        network.explorers?.map((explorer) => explorer.url ?? '') ?? [],
      );
      const canonicalNetworkName =
        NETWORK_TO_NAME_MAP[chainIdHex as keyof typeof NETWORK_TO_NAME_MAP] ??
        NETWORKS_BYPASSING_VALIDATION[
          chainIdHex as keyof typeof NETWORKS_BYPASSING_VALIDATION
        ]?.name ??
        network.name;

      networkFormState.setName(canonicalNetworkName);
      networkFormState.setChainId(String(network.chainId));
      networkFormState.setTicker(network.nativeCurrency.symbol);
      networkFormState.setRpcUrls({
        rpcEndpoints,
        defaultRpcEndpointIndex: rpcEndpoints.length ? 0 : undefined,
      });
      networkFormState.setBlockExplorers({
        blockExplorerUrls,
        defaultBlockExplorerUrlIndex: blockExplorerUrls.length ? 0 : undefined,
      });
      setView('add');
    },
    [
      createEventBuilder,
      dispatch,
      evmNetworks,
      networkFormState,
      setView,
      trackEvent,
    ],
  );

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
    runCloseTransition(() => navigate(DEFAULT_ROUTE));
  }, [dispatch, navigate, runCloseTransition]);

  const [pageToast, setPageToast] = useState<{
    chainId: string;
    nickname: string;
    newNetwork: boolean;
  } | null>(null);

  const dismissPageToast = useCallback(() => setPageToast(null), []);

  useEffect(() => {
    if (!pageToast) {
      return undefined;
    }
    const timeoutId = setTimeout(
      dismissPageToast,
      NETWORKS_PAGE_TOAST_DURATION_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [dismissPageToast, pageToast]);

  useEffect(() => {
    if (view !== '' || !rawEditedNetwork?.editCompleted) {
      return;
    }
    setPageToast({
      chainId: rawEditedNetwork.chainId,
      nickname: rawEditedNetwork.nickname ?? '',
      newNetwork: Boolean(rawEditedNetwork.newNetwork),
    });
    dispatch(setEditedNetwork());
  }, [dispatch, rawEditedNetwork, view]);

  useEffect(() => {
    if (view === 'add-from-chainlist' && !isChainlistEnabled) {
      setView('add');
    }
  }, [isChainlistEnabled, setView, view]);

  const handleSelectRpc = useCallback(
    (caipChainId: string, networkClientId: string) => {
      if (caipChainId === currentMultichainChainId) {
        dispatch(setActiveNetwork(networkClientId));
      }
      if (editedNetwork?.chainId) {
        setPageToast({
          chainId: editedNetwork.chainId,
          nickname: editedNetwork.name ?? '',
          newNetwork: false,
        });
      }
      setView();
    },
    [currentMultichainChainId, dispatch, editedNetwork, setView],
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
    dispatch(setEditedNetwork());
    const route =
      searchParams.get('drawerOpen') === 'true'
        ? `${DEFAULT_ROUTE}?drawerOpen=true`
        : DEFAULT_ROUTE;

    runCloseTransition(() => navigate(route));
  }, [dispatch, navigate, runCloseTransition, searchParams]);

  return (
    <Box className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background-default">
      {view === '' ? (
        <>
          <SettingsHeader
            title={t('manageNetworksMenuHeading')}
            onClose={handleRootBack}
            isSearchOpen={isSearchOpen}
            onOpenSearch={() => setIsSearchOpen(true)}
            onCloseSearch={() => setIsSearchOpen(false)}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchClear={() => setSearchValue('')}
            showSearchBorder={false}
          />
          <NetworksPageList
            searchQuery={searchValue}
            onAddCustomNetwork={handleNewNetwork}
            footerContent={
              pageToast ? (
                <Box
                  data-testid="networks-page-network-success-toast"
                  className="flex w-full items-center gap-3 rounded-xl border border-border-muted bg-background-section p-3"
                >
                  <Icon
                    name={IconName.Confirmation}
                    size={IconSize.Md}
                    color={IconColor.SuccessDefault}
                  />
                  <Text variant={TextVariant.BodyMd} className="flex-1">
                    {pageToast.newNetwork
                      ? t('newNetworkAdded', [pageToast.nickname])
                      : t('newNetworkEdited', [pageToast.nickname])}
                  </Text>
                  <ButtonIcon
                    ariaLabel={t('close')}
                    iconName={IconName.Close}
                    size={ButtonIconSize.Sm}
                    onClick={dismissPageToast}
                  />
                </Box>
              ) : null
            }
          />
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
            onAddFromChainlist={
              isChainlistEnabled ? handleAddFromChainlist : undefined
            }
          />
        </>
      ) : null}
      {view === 'add-from-chainlist' && isChainlistEnabled ? (
        <>
          <NetworksPageFormHeader
            title={t('addFromChainlist')}
            onBack={handleNewNetwork}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <ChainlistNetworkPicker
              existingNetworkChainIds={existingNetworkChainIds}
              existingNetworkNamesByChainId={existingNetworkNamesByChainId}
              onSelect={handleChainlistNetworkSelect}
            />
          </NetworksPageFormBody>
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
