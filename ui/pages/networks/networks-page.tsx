import {
  type NetworkConfiguration,
  RpcEndpointType,
  UpdateNetworkFields,
} from '@metamask/network-controller';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  ButtonIcon,
  ButtonIconSize,
  FontWeight,
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
import { useNetworkFormState } from '../../components/multichain/networks-form/networks-form-state';
import {
  type SafeChain,
  useSafeChains,
} from '../../components/multichain/networks-form/use-safe-chains';
import { setActiveNetwork, setEditedNetwork } from '../../store/actions';
import AddBlockExplorerModal from '../../components/multichain/network-list-menu/add-block-explorer-modal/add-block-explorer-modal';
import { SelectRpcUrlModal } from '../../components/multichain/network-list-menu/select-rpc-url-modal/select-rpc-url-modal';
import { AddNetwork } from '../../components/multichain/network-manager/components/add-network';
import { Header } from '../../components/multichain/pages/page';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getMultichainNetworkConfigurationsByChainId,
  getSelectedMultichainNetworkChainId,
} from '../../selectors/multichain/networks';
import { getEditedNetwork } from '../../selectors/selectors';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { SettingsHeader } from '../settings/shared/settings-header';
import { useGlobalMenuRouteTransition } from '../routes/global-menu-route-transition';
import { AddRpcUrlPageForm } from './add-rpc-url-page-form';
import { NetworksPageList } from './networks-page-list';

const getViewAfterRpcAdd = (view: string) =>
  view === 'edit-rpc' ? 'edit' : 'add';

const getViewAfterExplorerAdd = (view: string) =>
  view === 'edit-explorer-url' ? 'edit' : 'add';

const NETWORKS_PAGE_TOAST_DURATION_MS = 5000;

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

type ChainlistNetwork = SafeChain & {
  chain?: string;
  chainId: string | number;
  explorers?: { url?: string }[];
};

const getHexChainId = (chainId: string | number) =>
  `0x${Number(chainId).toString(16)}`.toLowerCase();

const getUsableUrls = (urls: string[] = []) =>
  urls.filter((url) => {
    if (!url || url.includes('${')) {
      return false;
    }

    try {
      const { protocol } = new URL(url);
      return protocol === 'https:' || protocol === 'http:';
    } catch {
      return false;
    }
  });

const CHAINLIST_ROW_COLORS = [
  'bg-success-default',
  'bg-warning-muted',
  'bg-icon-default',
  'bg-primary-default',
  'bg-info-muted',
  'bg-error-default',
  'bg-success-muted',
  'bg-primary-muted',
];

const CHAINLIST_PAGE_SIZE = 100;
const CHAINLIST_SCROLL_THRESHOLD_PX = 120;

const ChainlistNetworkPicker = ({
  existingNetworkChainIds,
  onSelect,
}: {
  existingNetworkChainIds: Set<string>;
  onSelect: (network: ChainlistNetwork) => void;
}) => {
  const t = useI18nContext();
  const [searchValue, setSearchValue] = useState('');
  const [visibleNetworkCount, setVisibleNetworkCount] =
    useState(CHAINLIST_PAGE_SIZE);
  const { safeChains } = useSafeChains();

  const chainlistNetworks = useMemo(() => {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    return ((safeChains ?? []) as ChainlistNetwork[]).filter((network) => {
      if (getUsableUrls(network.rpc).length === 0) {
        return false;
      }

      if (!normalizedSearchValue) {
        return true;
      }

      return (
        network.name.toLowerCase().includes(normalizedSearchValue) ||
        String(network.chainId).includes(normalizedSearchValue)
      );
    });
  }, [safeChains, searchValue]);

  const visibleChainlistNetworks = useMemo(
    () => chainlistNetworks.slice(0, visibleNetworkCount),
    [chainlistNetworks, visibleNetworkCount],
  );

  useEffect(() => {
    setVisibleNetworkCount(CHAINLIST_PAGE_SIZE);
  }, [searchValue]);

  const handleChainlistScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const { scrollHeight, scrollTop, clientHeight } = event.currentTarget;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceFromBottom > CHAINLIST_SCROLL_THRESHOLD_PX) {
        return;
      }

      setVisibleNetworkCount((currentCount) =>
        Math.min(currentCount + CHAINLIST_PAGE_SIZE, chainlistNetworks.length),
      );
    },
    [chainlistNetworks.length],
  );

  return (
    <Box className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background-default">
      <Box className="px-4 pb-4">
        <Box className="relative">
          <Icon
            name={IconName.Search}
            size={IconSize.Sm}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-icon-muted"
          />
          <input
            aria-label={t('searchNetworkNameOrChainId')}
            className="h-14 w-full rounded-xl border border-border-muted bg-background-default pl-11 pr-4 text-base text-text-default outline-none focus:border-primary-default"
            data-testid="networks-page-chainlist-search"
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t('searchNetworkNameOrChainId')}
            value={searchValue}
          />
        </Box>
      </Box>
      <Box
        className="min-h-0 flex-1 overflow-y-auto"
        data-testid="networks-page-chainlist-network-list"
        onScroll={handleChainlistScroll}
      >
        {visibleChainlistNetworks.map((network, index) => {
          const isExistingNetwork = existingNetworkChainIds.has(
            getHexChainId(network.chainId),
          );

          return (
            <button
              className={`flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-hover active:bg-pressed ${
                isExistingNetwork ? 'bg-muted' : ''
              }`}
              data-testid="networks-page-chainlist-network"
              key={`${network.chainId}-${network.name}`}
              onClick={() => onSelect(network)}
              type="button"
            >
              <Box
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium text-text-default ${
                  CHAINLIST_ROW_COLORS[index % CHAINLIST_ROW_COLORS.length]
                }`}
              >
                {network.name.charAt(0).toUpperCase()}
              </Box>
              <Box className="min-w-0 flex-1">
                <Box className="flex min-w-0 items-center gap-2">
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    className="truncate"
                  >
                    {network.name}
                  </Text>
                  {isExistingNetwork ? (
                    <Box
                      className="shrink-0 rounded-full bg-muted px-2 py-0.5"
                      data-testid="networks-page-chainlist-added-pill"
                    >
                      <Text
                        variant={TextVariant.BodySm}
                        className="text-text-alternative"
                      >
                        {t('added')}
                      </Text>
                    </Box>
                  ) : null}
                </Box>
                <Text
                  variant={TextVariant.BodyMd}
                  className="truncate text-text-alternative"
                >
                  {t('chainlistNetworkDetails', [
                    network.nativeCurrency.symbol,
                    String(network.chainId),
                  ])}
                </Text>
              </Box>
            </button>
          );
        })}
      </Box>
    </Box>
  );
};

export const NetworksPage = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();
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
  const rawEditedNetwork = useSelector(getEditedNetwork);
  const { chainId: editingChainId, editCompleted } = rawEditedNetwork ?? {};

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
  const existingNetworkChainIds = useMemo(
    () =>
      new Set(
        Object.values(evmNetworks).map((network) =>
          network.chainId.toLowerCase(),
        ),
      ),
    [evmNetworks],
  );

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

  const handleAddFromChainlist = useCallback(() => {
    setView('add-from-chainlist');
  }, [setView]);

  const handleChainlistNetworkSelect = useCallback(
    (network: ChainlistNetwork) => {
      const chainIdHex = getHexChainId(network.chainId);
      const existingNetwork =
        evmNetworks[chainIdHex as keyof typeof evmNetworks];

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

      const rpcEndpoints = getUsableUrls(network.rpc).map((url) => ({
        url,
        type: RpcEndpointType.Custom,
      }));
      const blockExplorerUrls = getUsableUrls(
        network.explorers?.map((explorer) => explorer.url ?? '') ?? [],
      );

      networkFormState.setName(network.name);
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
    [dispatch, evmNetworks, networkFormState, setView],
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
            onAddFromChainlist={handleAddFromChainlist}
          />
        </>
      ) : null}
      {view === 'add-from-chainlist' ? (
        <>
          <NetworksPageFormHeader
            title={t('addFromChainlist')}
            onBack={handleNewNetwork}
            onClose={handleClose}
          />
          <NetworksPageFormBody>
            <ChainlistNetworkPicker
              existingNetworkChainIds={existingNetworkChainIds}
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
