import log from 'loglevel';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  HelpText,
  HelpTextSeverity,
  IconName,
  Label,
  Text,
  TextButton,
  TextButtonSize,
  TextColor,
  TextField,
  TextFieldSize,
  TextVariant,
} from '@metamask/design-system-react';
import {
  type UpdateNetworkFields,
  RpcEndpointType,
} from '@metamask/network-controller';
import { Hex, isStrictHexString, hexToNumber } from '@metamask/utils';
import { NETWORKS_BYPASSING_VALIDATION } from '@metamask/controller-utils';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsNetworkEventSource,
} from '../../../../shared/constants/metametrics';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_IDS,
  infuraProjectId,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import { getFailoverUrlsForChainId } from '../../../../shared/constants/network-failover';
import {
  decimalToHex,
  hexToDecimal,
} from '../../../../shared/lib/conversion.utils';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../shared/lib/network.utils';
import {
  isRpcRateLimitError,
  jsonRpcRequest,
} from '../../../../shared/lib/rpc.utils';
import { submitRequestToBackground } from '../../../store/background-connection';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import {
  addNetwork,
  setEditedNetwork,
  setEnabledNetworks,
  setTokenNetworkFilter,
  showDeprecatedNetworkModal,
  toggleNetworkMenu,
  updateNetwork,
} from '../../../store/actions';
import RpcListItem, {
  stripKeyFromInfuraUrl,
  stripProtocol,
} from '../network-list-menu/rpc-list-item';
import {
  DropdownEditor,
  DropdownEditorStyle,
} from '../dropdown-editor/dropdown-editor';
import {
  getIsRpcFailoverEnabled,
  getTokenNetworkFilter,
} from '../../../selectors';
import { onlyKeepHost } from '../../../../shared/lib/only-keep-host';
import { useDispatch } from '../../../store/hooks';
import {
  ChainlistNetworkPicker,
  type ChainlistNetwork,
  getUsableUrls,
} from '../../../pages/networks/chainlist-network-picker';
import { useSafeChains, rpcIdentifierUtility } from './use-safe-chains';
import { useNetworkFormState } from './networks-form-state';

export type NetworksFormChainlist = {
  existingNetworkChainIds: Set<string>;
  existingNetworkNamesByChainId: Record<string, string>;
  onSelect: (network: ChainlistNetwork, searchQuery?: string) => void;
};

export const NetworksForm = ({
  networkFormState,
  existingNetwork,
  trackRpcUpdateFromBanner,
  onRpcAdd,
  onBlockExplorerAdd,
  toggleNetworkMenuAfterSubmit = true,
  usePageFooterStyle = false,
  onComplete,
  onEdit,
  onAddFromChainlist,
  chainlist,
}: {
  networkFormState: ReturnType<typeof useNetworkFormState>;
  existingNetwork?: UpdateNetworkFields;
  trackRpcUpdateFromBanner?: boolean;
  onRpcAdd: () => void;
  onBlockExplorerAdd: () => void;
  toggleNetworkMenuAfterSubmit?: boolean;
  usePageFooterStyle?: boolean;
  onComplete?: () => void;
  onEdit?: () => void;
  onAddFromChainlist?: () => void;
  chainlist?: NetworksFormChainlist;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const scrollableRef = useRef<HTMLDivElement>(null);
  const nameFieldRef = useRef<HTMLDivElement>(null);
  const chainIdFieldRef = useRef<HTMLDivElement>(null);
  const chainlistPanelRef = useRef<HTMLDivElement>(null);
  const didTrackChainlistOpen = useRef(false);
  const showChainlist = Boolean(chainlist) && !existingNetwork;
  // Returning from add RPC or add block explorer remounts this form. Keep the
  // list closed when the user already entered a network, so those fields stay
  // visible.
  const formAlreadyStarted = Boolean(
    networkFormState.name ||
    networkFormState.chainId ||
    networkFormState.ticker ||
    networkFormState.rpcUrls.rpcEndpoints.length ||
    networkFormState.blockExplorers.blockExplorerUrls.length,
  );
  const [hasDismissedChainlist, setHasDismissedChainlist] = useState(false);
  const [isChainlistOpen, setIsChainlistOpen] = useState(
    showChainlist && !formAlreadyStarted,
  );
  const [chainlistAnchor, setChainlistAnchor] = useState<'name' | 'chainId'>(
    'name',
  );
  const chainlistFillsForm = isChainlistOpen && chainlistAnchor === 'name';

  // Open on the first render that has Chainlist, including when the flag
  // arrives after mount. Later closes stay closed.
  if (
    showChainlist &&
    !formAlreadyStarted &&
    !hasDismissedChainlist &&
    !isChainlistOpen
  ) {
    setIsChainlistOpen(true);
  }

  const trackChainlistOpened = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.ChainlistAddClicked)
        .addCategory(MetaMetricsEventCategory.Network)
        .build(),
    );
  };

  const openChainlist = (anchor: 'name' | 'chainId') => {
    if (!showChainlist) {
      return;
    }
    setChainlistAnchor(anchor);
    if (isChainlistOpen) {
      return;
    }
    trackChainlistOpened();
    setIsChainlistOpen(true);
  };

  const closeChainlist = () => {
    setHasDismissedChainlist(true);
    setIsChainlistOpen(false);
  };

  useEffect(() => {
    if (!isChainlistOpen || didTrackChainlistOpen.current) {
      return;
    }
    didTrackChainlistOpen.current = true;
    trackChainlistOpened();
    // The open event is recorded once for the initial list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChainlistOpen]);

  useEffect(() => {
    if (!isChainlistOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const { target } = event;
      if (!(target instanceof Node)) {
        return;
      }
      if (
        chainlistPanelRef.current?.contains(target) ||
        nameFieldRef.current?.contains(target) ||
        chainIdFieldRef.current?.contains(target)
      ) {
        return;
      }
      closeChainlist();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeChainlist();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isChainlistOpen]);
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const isRpcFailoverEnabled = useSelector(getIsRpcFailoverEnabled);

  const {
    source,
    setSource,
    name,
    setName,
    chainId,
    setChainId,
    ticker,
    setTicker,
    rpcUrls,
    setRpcUrls,
    blockExplorers,
    setBlockExplorers,
  } = networkFormState;

  const defaultRpcEndpoint =
    rpcUrls.defaultRpcEndpointIndex === undefined
      ? undefined
      : rpcUrls.rpcEndpoints[rpcUrls.defaultRpcEndpointIndex];

  const networkChainIdHex = chainId === '' ? undefined : toHex(chainId);
  const chainFailoverUrls = networkChainIdHex
    ? getFailoverUrlsForChainId(networkChainIdHex)
    : [];

  // Failover only applies to Infura RPC endpoints. NetworkController wires
  // failover URLs solely for Infura endpoints; applying them to custom RPCs
  // would leak requests to the failover, so it does not. Only surface failover
  // in the form for Infura endpoints so the UI matches the actual behaviour.
  const failoverUrlsForEndpoint = (endpoint?: { url: string }) => {
    return endpoint?.url &&
      new URL(endpoint.url).hostname.endsWith('.infura.io')
      ? chainFailoverUrls
      : [];
  };

  const defaultFailoverUrls = failoverUrlsForEndpoint(defaultRpcEndpoint);

  const { safeChains } = useSafeChains();

  const [rpcFetchError, setRpcFetchError] = useState<
    { key: string; msg: string } | undefined
  >();
  const [fetchedChainId, setFetchedChainId] = useState<string>();
  const failedChainlistRpcUrlsRef = useRef(new Set<string>());
  // Save writes this chain into network configurations before the form closes.
  // Skip the duplicate warning for that chain so the network just added is not
  // reported as already saved.
  const [submittedChainId, setSubmittedChainId] = useState<string | undefined>(
    undefined,
  );

  const tokenNetworkFilter = useSelector(getTokenNetworkFilter);

  const templateInfuraRpc = (endpoint: string) =>
    endpoint.endsWith('{infuraProjectId}')
      ? endpoint.replace('{infuraProjectId}', infuraProjectId ?? '')
      : endpoint;

  const chainIdHex = chainId ? toHex(chainId) : undefined;

  const { suggestedName, nameWarning } = useMemo(() => {
    const expectedName = chainIdHex
      ? (NETWORK_TO_NAME_MAP[chainIdHex as keyof typeof NETWORK_TO_NAME_MAP] ??
        NETWORKS_BYPASSING_VALIDATION[
          chainIdHex as keyof typeof NETWORKS_BYPASSING_VALIDATION
        ]?.name ??
        safeChains?.find((chain) => toHex(chain.chainId) === chainIdHex)?.name)
      : undefined;

    const mismatch = Boolean(expectedName && expectedName !== name);
    return {
      suggestedName: mismatch ? expectedName : undefined,
      nameWarning: mismatch
        ? {
            key: 'wrongNetworkName',
            msg: t('wrongNetworkName'),
          }
        : undefined,
    };
  }, [chainIdHex, name, safeChains, t]);

  const { suggestedTicker, tickerWarning } = useMemo(() => {
    const expectedSymbol = chainIdHex
      ? (CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
          chainIdHex as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
        ] ??
        safeChains?.find((chain) => toHex(chain.chainId) === chainIdHex)
          ?.nativeCurrency?.symbol)
      : undefined;

    const isWhitelistedSymbol = chainIdHex
      ? NETWORKS_BYPASSING_VALIDATION[
          chainIdHex as keyof typeof NETWORKS_BYPASSING_VALIDATION
        ]?.symbol?.toLowerCase() === ticker?.toLowerCase()
      : false;

    const mismatch = Boolean(
      expectedSymbol && expectedSymbol !== ticker && !isWhitelistedSymbol,
    );

    return {
      suggestedTicker: mismatch ? expectedSymbol : undefined,
      tickerWarning: mismatch
        ? {
            key: 'chainListReturnedDifferentTickerSymbol',
            msg: t('chainListReturnedDifferentTickerSymbol'),
          }
        : undefined,
    };
  }, [chainIdHex, ticker, safeChains, t]);

  const chainIdError = useMemo(() => {
    let error: [string, string] | undefined;

    if (chainId === undefined || chainId === '') {
      error = undefined;
    } else if (chainId.startsWith('0x')) {
      if (!/^0x[0-9a-f]+$/iu.test(chainId)) {
        error = ['invalidHexNumber', t('invalidHexNumber')];
      } else if (!isPrefixedFormattedHexString(chainId)) {
        error = ['invalidHexNumber', t('invalidHexNumberLeadingZeros')];
      }
    } else if (!/^[0-9]+$/u.test(chainId)) {
      error = ['invalidNumber', t('invalidNumber')];
    } else if (chainId.startsWith('0')) {
      error = ['invalidNumberLeadingZeros', t('invalidNumberLeadingZeros')];
    }

    if (
      chainId &&
      !error &&
      !isSafeChainId(parseInt(chainId, chainId.startsWith('0x') ? 16 : 10))
    ) {
      error = ['invalidChainIdTooBig', t('invalidChainIdTooBig')];
    }

    if (!error && !existingNetwork && chainIdHex !== submittedChainId) {
      const matchingNetwork = chainIdHex
        ? networkConfigurations[chainIdHex]
        : undefined;
      if (matchingNetwork) {
        error = [
          'existingChainId',
          t('chainIdExistsErrorMsg', [matchingNetwork.name]),
        ];
      }
    }

    return error ? { key: error[0], msg: error[1] } : undefined;
  }, [
    chainId,
    chainIdHex,
    existingNetwork,
    networkConfigurations,
    submittedChainId,
    t,
  ]);

  const rpcMismatchError = useMemo(() => {
    if (fetchedChainId && chainIdHex && fetchedChainId !== chainIdHex) {
      return {
        key: 'endpointReturnedDifferentChainId',
        msg: t('endpointReturnedDifferentChainId', [
          hexToDecimal(fetchedChainId),
        ]),
      };
    }
    return undefined;
  }, [fetchedChainId, chainIdHex, t]);

  const warnings = useMemo(
    () => ({
      name: nameWarning,
      ticker: tickerWarning,
    }),
    [nameWarning, tickerWarning],
  );

  const errors = useMemo(
    () => ({
      chainId: chainIdError,
      rpcUrl: rpcFetchError ?? rpcMismatchError,
    }),
    [chainIdError, rpcFetchError, rpcMismatchError],
  );

  const selectedRpcUrl =
    rpcUrls?.rpcEndpoints?.[rpcUrls?.defaultRpcEndpointIndex ?? -1]?.url;
  const [prevSelectedRpcUrl, setPrevSelectedRpcUrl] = useState(selectedRpcUrl);

  if (selectedRpcUrl !== prevSelectedRpcUrl) {
    setPrevSelectedRpcUrl(selectedRpcUrl);
    setRpcFetchError(undefined);
    setFetchedChainId(undefined);
  }

  const rpcEndpointCount = rpcUrls.rpcEndpoints?.length ?? 0;

  useEffect(() => {
    failedChainlistRpcUrlsRef.current.clear();
  }, [chainId]);

  // Fetch the chain ID from the RPC endpoint when it changes. A Chainlist
  // pick tries the next public URL before surfacing a fetch error.
  useEffect(() => {
    if (!selectedRpcUrl) {
      return undefined;
    }

    let cancelled = false;
    const replaceWithNextChainlistRpc = () => {
      if (source !== 'chainlist' || !chainIdHex || rpcEndpointCount !== 1) {
        return false;
      }

      failedChainlistRpcUrlsRef.current.add(selectedRpcUrl);
      const chain = safeChains?.find(
        (candidate) => toHex(candidate.chainId) === chainIdHex,
      );
      const nextUrl = getUsableUrls(chain?.rpc).find(
        (url) => !failedChainlistRpcUrlsRef.current.has(url),
      );
      if (!nextUrl) {
        return false;
      }

      setRpcUrls({
        rpcEndpoints: [{ url: nextUrl, type: RpcEndpointType.Custom }],
        defaultRpcEndpointIndex: 0,
      });
      return true;
    };

    jsonRpcRequest(templateInfuraRpc(selectedRpcUrl), 'eth_chainId')
      .then((response) => {
        if (!cancelled) {
          setFetchedChainId(response as string);
        }
      })
      .catch((err) => {
        if (cancelled || replaceWithNextChainlistRpc()) {
          return;
        }

        setFetchedChainId(undefined);
        log.warn('Failed to fetch the chainId from the endpoint.', err);
        const errorKey = isRpcRateLimitError(err)
          ? 'rpcUrlRateLimited'
          : 'failedToFetchChainId';
        setRpcFetchError({
          key: errorKey,
          msg: t(errorKey),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    chainIdHex,
    rpcEndpointCount,
    safeChains,
    selectedRpcUrl,
    setRpcUrls,
    source,
    t,
  ]);

  const onSubmit = async () => {
    try {
      if (chainIdHex === CHAIN_IDS.GOERLI) {
        dispatch(showDeprecatedNetworkModal());
      } else if (chainIdHex) {
        const networkPayload = {
          chainId: chainIdHex,
          name,
          nativeCurrency: ticker,
          rpcEndpoints: rpcUrls?.rpcEndpoints,
          defaultRpcEndpointIndex: rpcUrls?.defaultRpcEndpointIndex ?? 0,
          blockExplorerUrls: blockExplorers?.blockExplorerUrls,
          defaultBlockExplorerUrlIndex:
            blockExplorers?.defaultBlockExplorerUrlIndex,
        };

        if (existingNetwork) {
          const options = {
            replacementSelectedRpcEndpointIndex:
              chainIdHex === existingNetwork.chainId
                ? rpcUrls?.defaultRpcEndpointIndex
                : undefined,
          };
          await dispatch(updateNetwork(networkPayload, options));
          if (
            toggleNetworkMenuAfterSubmit &&
            Object.keys(tokenNetworkFilter).length === 1
          ) {
            await dispatch(
              setTokenNetworkFilter({
                [existingNetwork.chainId]: true,
              }),
            );
            await dispatch(setEnabledNetworks(existingNetwork.chainId));
          }

          // Track RPC update from network connection banner
          // Wrapped in try-catch to prevent analytics failures from affecting the UI
          // since the network update has already succeeded at this point
          if (trackRpcUpdateFromBanner) {
            try {
              const newRpcEndpoint =
                networkPayload.rpcEndpoints[
                  networkPayload.defaultRpcEndpointIndex
                ];
              const oldRpcEndpoint =
                existingNetwork.rpcEndpoints?.[
                  existingNetwork.defaultRpcEndpointIndex ?? 0
                ];

              const chainIdAsDecimal = hexToNumber(chainIdHex);

              const sanitizeRpcUrl = async (url: string) => {
                const isPublic = await submitRequestToBackground<boolean>(
                  'isPublicEndpointUrl',
                  [url],
                );
                return isPublic ? onlyKeepHost(url) : 'custom';
              };

              const [fromRpcDomain, toRpcDomain] = await Promise.all([
                oldRpcEndpoint?.url
                  ? sanitizeRpcUrl(oldRpcEndpoint.url)
                  : Promise.resolve('unknown'),
                sanitizeRpcUrl(newRpcEndpoint.url),
              ]);

              trackEvent(
                createEventBuilder(
                  MetaMetricsEventName.NetworkConnectionBannerRpcUpdated,
                )
                  .addCategory(MetaMetricsEventCategory.Network)
                  .addProperties({
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    chain_id_caip: `eip155:${chainIdAsDecimal}`,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    from_rpc_domain: fromRpcDomain,
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    to_rpc_domain: toRpcDomain,
                  })
                  .build(),
              );
            } catch (error) {
              // Analytics tracking failed, but network update succeeded - don't surface this error
              console.error('Failed to track RPC update analytics:', error);
            }
          }
        } else {
          // When the form is rendered as a page (Networks page), do NOT switch
          // the active network or update the homepage network filter. Adding a
          // network from the Networks page should only persist the
          // configuration; switching is reserved for the homepage network
          // modal (`toggleNetworkMenuAfterSubmit=true`).
          setSubmittedChainId(chainIdHex);
          await dispatch(
            addNetwork(networkPayload, {
              setActive: toggleNetworkMenuAfterSubmit,
            }),
          );
          if (toggleNetworkMenuAfterSubmit) {
            await dispatch(setEnabledNetworks(networkPayload.chainId));
          }
        }

        trackEvent(
          createEventBuilder(MetaMetricsEventName.CustomNetworkAdded)
            .addCategory(MetaMetricsEventCategory.Network)
            .addProperties({
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              block_explorer_url:
                blockExplorers?.blockExplorerUrls?.[
                  blockExplorers?.defaultBlockExplorerUrlIndex ?? -1
                ],
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              chain_id: chainIdHex,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              network_name: name,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              source_connection_method:
                MetaMetricsNetworkEventSource.CustomNetworkForm,
              source,
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
              // eslint-disable-next-line @typescript-eslint/naming-convention
              token_symbol: ticker,
            })
            .addSensitiveProperties({
              rpcUrl: rpcIdentifierUtility(
                rpcUrls?.rpcEndpoints[rpcUrls.defaultRpcEndpointIndex ?? -1]
                  ?.url,
                safeChains ?? [],
              ),
            })
            .build(),
        );

        dispatch(
          setEditedNetwork({
            chainId: chainIdHex,
            nickname: name,
            editCompleted: true,
            newNetwork: !existingNetwork,
          }),
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      toggleNetworkMenuAfterSubmit && dispatch(toggleNetworkMenu());
      onComplete?.();
    }
  };

  const isSaveDisabled =
    !name ||
    !chainId ||
    !ticker ||
    !rpcUrls?.rpcEndpoints?.length ||
    Object.values(errors).some((error) => error);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      ref={scrollableRef}
      className="networks-form__scrollable h-full min-h-0"
    >
      <Box
        paddingHorizontal={4}
        paddingBottom={2}
        flexDirection={chainlistFillsForm ? BoxFlexDirection.Column : undefined}
        className={
          chainlistFillsForm
            ? 'min-h-0 w-full flex-1 overflow-hidden'
            : 'w-full'
        }
      >
        {onAddFromChainlist && !existingNetwork && !showChainlist ? (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            startIconName={IconName.FlashFilled}
            isFullWidth
            onClick={onAddFromChainlist}
            className="mb-4"
            data-testid="network-form-add-from-chainlist"
          >
            {t('addFromChainlist')}
          </Button>
        ) : null}
        <Label htmlFor="networkName" className="mb-1 shrink-0">
          {t('networkName')}
        </Label>
        <TextField
          ref={nameFieldRef}
          id="networkName"
          size={TextFieldSize.Lg}
          placeholder={t('enterNetworkName')}
          data-testid="network-form-name-input"
          autoFocus
          className="w-full shrink-0"
          onClick={() => openChainlist('name')}
          onFocus={(event) => {
            // Mount auto-focus has no relatedTarget. Skip it once the form
            // already has a network so returning from RPC or block explorer
            // does not cover those fields.
            if (formAlreadyStarted && !event.relatedTarget) {
              return;
            }
            openChainlist('name');
          }}
          onChange={(event) => {
            setName(event.target.value);
            openChainlist('name');
          }}
          inputProps={
            {
              'data-testid': 'network-form-network-name',
            } as React.ComponentPropsWithoutRef<'input'>
          }
          value={name}
        />
        {showChainlist && chainlist && chainlistFillsForm ? (
          <Box
            ref={chainlistPanelRef}
            flexDirection={BoxFlexDirection.Column}
            className="mt-1 min-h-0 flex-1 overflow-hidden rounded-xl border border-border-muted"
            data-testid="networks-page-chainlist-dropdown"
            data-anchor="name"
          >
            <ChainlistNetworkPicker
              existingNetworkChainIds={chainlist.existingNetworkChainIds}
              existingNetworkNamesByChainId={
                chainlist.existingNetworkNamesByChainId
              }
              layout="dropdown"
              searchValue={name}
              showSearchField={false}
              onSelect={(network, searchQuery) => {
                setSource('chainlist');
                closeChainlist();
                chainlist.onSelect(network, searchQuery);
              }}
              onUseTypedName={(typedName) => {
                setSource('manual');
                setName(typedName);
                closeChainlist();
              }}
            />
          </Box>
        ) : null}
        <Box className={chainlistFillsForm ? 'hidden' : undefined}>
          {name && warnings?.name?.msg ? (
            <HelpText severity={HelpTextSeverity.Warning}>
              {warnings.name.msg}
            </HelpText>
          ) : null}
          {suggestedName ? (
            <Text
              asChild
              variant={TextVariant.BodySm}
              color={TextColor.TextDefault}
              data-testid="network-form-name-suggestion"
            >
              <span>
                {t('suggestedTokenName')}
                <TextButton
                  size={TextButtonSize.BodySm}
                  onClick={() => {
                    setName(suggestedName);
                  }}
                  className="px-1 align-baseline"
                >
                  {suggestedName}
                </TextButton>
              </span>
            </Text>
          ) : null}
          <DropdownEditor
            title={t('defaultRpcUrl')}
            placeholder={t('addAUrl')}
            style={DropdownEditorStyle.PopoverStyle}
            items={rpcUrls.rpcEndpoints}
            itemKey={(endpoint) => endpoint.url}
            itemDataTestId={(endpoint, index) =>
              `network-form-rpc-option-${endpoint.name ?? String(index)}`
            }
            selectedItemIndex={rpcUrls.defaultRpcEndpointIndex}
            error={Boolean(errors.rpcUrl)}
            buttonDataTestId="test-add-rpc-drop-down"
            renderItem={(item) => {
              const failoverUrls = failoverUrlsForEndpoint(item);
              return item?.name ||
                item?.type === RpcEndpointType.Infura ||
                failoverUrls.length > 0 ? (
                <RpcListItem
                  rpcEndpoint={{
                    ...item,
                    failoverUrls,
                  }}
                />
              ) : (
                // A custom (non Infura) endpoint never has a failover, so it just
                // renders the URL with no failover tag.
                <Text
                  asChild
                  ellipsis
                  variant={TextVariant.BodyMd}
                  className="flex items-center gap-1 py-2"
                >
                  <span>{stripProtocol(stripKeyFromInfuraUrl(item.url))}</span>
                </Text>
              );
            }}
            renderTooltip={(item, isList) => {
              const url = stripKeyFromInfuraUrl(item.url);
              return url.length > (isList ? 37 : 35) ? url : undefined;
            }}
            addButtonText={t('addRpcUrl')}
            itemIsDeletable={(item) => item.type !== RpcEndpointType.Infura}
            onItemAdd={onRpcAdd}
            onItemSelected={(index) =>
              setRpcUrls((state) => ({
                ...state,
                defaultRpcEndpointIndex: index,
              }))
            }
            onItemDeleted={(deletedIndex, newSelectedIndex) => {
              setRpcUrls({
                rpcEndpoints: rpcUrls.rpcEndpoints
                  ?.slice(0, deletedIndex)
                  .concat(rpcUrls.rpcEndpoints.slice(deletedIndex + 1)),
                defaultRpcEndpointIndex: newSelectedIndex,
              });
            }}
          />

          {errors.rpcUrl?.msg && (
            <HelpText
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {errors.rpcUrl?.msg}
            </HelpText>
          )}

          {isRpcFailoverEnabled && defaultFailoverUrls.length > 0 ? (
            <div className="mt-4">
              <Label htmlFor="failoverRpcUrl" className="mb-1">
                {t('failoverRpcUrl')}
              </Label>
              <TextField
                id="failoverRpcUrl"
                size={TextFieldSize.Lg}
                className="w-full"
                value={onlyKeepHost(defaultFailoverUrls[0])}
                isDisabled
              />
            </div>
          ) : null}

          <div className="relative mt-4">
            <Label htmlFor="chainId" className="mb-1">
              {t('chainId')}
            </Label>
            <TextField
              ref={chainIdFieldRef}
              id="chainId"
              size={TextFieldSize.Lg}
              placeholder={t('enterChainId')}
              data-testid="network-form-chain-id-input"
              className="w-full"
              onClick={() => openChainlist('chainId')}
              onFocus={() => openChainlist('chainId')}
              onChange={(event) => {
                setChainId(event.target.value.trim());
                openChainlist('chainId');
              }}
              isError={Boolean(errors?.chainId)}
              inputProps={
                {
                  'data-testid': 'network-form-chain-id',
                } as React.ComponentPropsWithoutRef<'input'>
              }
              value={chainId}
              isDisabled={Boolean(existingNetwork)}
            />
            {showChainlist &&
            chainlist &&
            isChainlistOpen &&
            chainlistAnchor === 'chainId' ? (
              <Box
                ref={chainlistPanelRef}
                flexDirection={BoxFlexDirection.Column}
                className="absolute inset-x-0 top-full z-10 mt-1 h-80 overflow-hidden rounded-xl border border-border-muted bg-background-default"
                data-testid="networks-page-chainlist-dropdown"
                data-anchor="chainId"
              >
                <ChainlistNetworkPicker
                  existingNetworkChainIds={chainlist.existingNetworkChainIds}
                  existingNetworkNamesByChainId={
                    chainlist.existingNetworkNamesByChainId
                  }
                  layout="dropdown"
                  searchValue={chainId}
                  showSearchField={false}
                  onSelect={(network, searchQuery) => {
                    setSource('chainlist');
                    closeChainlist();
                    chainlist.onSelect(network, searchQuery);
                  }}
                  onUseTypedName={(typedName) => {
                    setSource('manual');
                    setName(typedName);
                    closeChainlist();
                  }}
                />
              </Box>
            ) : null}
          </div>

          {errors.chainId?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              {errors.chainId.msg}
            </HelpText>
          ) : null}
          {errors.chainId?.key === 'existingChainId' ? (
            <HelpText
              asChild
              severity={HelpTextSeverity.Danger}
              data-testid="network-form-chain-id-error"
            >
              <div>
                {t('updateOrEditNetworkInformations')}{' '}
                <TextButton
                  size={TextButtonSize.BodySm}
                  onClick={() => {
                    if (chainIdHex) {
                      dispatch(
                        setEditedNetwork({
                          chainId: chainIdHex,
                        }),
                      );
                      onEdit?.();
                    }
                  }}
                >
                  {t('editNetworkLink')}
                </TextButton>
              </div>
            </HelpText>
          ) : null}
          <div className="mt-4">
            <Label htmlFor="nativeCurrency" className="mb-1">
              {t('currencySymbol')}
            </Label>
            <TextField
              id="nativeCurrency"
              size={TextFieldSize.Lg}
              placeholder={t('enterSymbol')}
              data-testid="network-form-ticker"
              className="w-full"
              onChange={(event) => {
                setTicker(event.target.value);
              }}
              inputProps={
                {
                  'data-testid': 'network-form-ticker-input',
                } as React.ComponentPropsWithoutRef<'input'>
              }
              value={ticker}
            />
            {suggestedTicker ? (
              <Text
                asChild
                variant={TextVariant.BodySm}
                color={TextColor.TextDefault}
                data-testid="network-form-ticker-suggestion"
              >
                <span>
                  {t('suggestedCurrencySymbol')}
                  <TextButton
                    size={TextButtonSize.BodySm}
                    onClick={() => {
                      setTicker(suggestedTicker);
                    }}
                    className="px-1 align-baseline"
                  >
                    {suggestedTicker}
                  </TextButton>
                </span>
              </Text>
            ) : null}
          </div>
          {ticker && warnings.ticker?.msg ? (
            <HelpText
              severity={HelpTextSeverity.Warning}
              data-testid="network-form-ticker-warning"
            >
              {warnings.ticker.msg}
            </HelpText>
          ) : null}

          <DropdownEditor
            title={t('blockExplorerUrl')}
            placeholder={t('addAUrl')}
            style={DropdownEditorStyle.BoxStyle}
            items={blockExplorers.blockExplorerUrls}
            itemKey={(item) => `${item}`}
            selectedItemIndex={blockExplorers.defaultBlockExplorerUrlIndex}
            addButtonText={t('addBlockExplorerUrl')}
            onItemAdd={onBlockExplorerAdd}
            buttonDataTestId="test-explorer-drop-down"
            onItemSelected={(index) =>
              setBlockExplorers((state) => ({
                ...state,
                defaultBlockExplorerUrlIndex: index,
              }))
            }
            onItemDeleted={(deletedIndex, newSelectedIndex) => {
              setBlockExplorers({
                blockExplorerUrls: blockExplorers.blockExplorerUrls
                  ?.slice(0, deletedIndex)
                  .concat(
                    blockExplorers.blockExplorerUrls.slice(deletedIndex + 1),
                  ),
                defaultBlockExplorerUrlIndex: newSelectedIndex,
              });
            }}
            // Scroll to bottom so all URLs are visible
            onDropdownOpened={() => {
              if (scrollableRef.current) {
                scrollableRef.current.scrollTop =
                  scrollableRef.current.scrollHeight;
              }
            }}
            renderItem={(item) => (
              <Text
                asChild
                ellipsis
                color={TextColor.TextDefault}
                variant={TextVariant.BodyMd}
                className="bg-transparent px-0 py-2"
              >
                <span>{stripProtocol(item)}</span>
              </Text>
            )}
            renderTooltip={(item) => (item.length > 36 ? item : undefined)}
          />
        </Box>
      </Box>
      <Box
        className={`networks-form__footer w-full${
          usePageFooterStyle ? ' networks-form__footer--page' : ''
        }`}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        padding={4}
      >
        {usePageFooterStyle ? (
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            isDisabled={isSaveDisabled}
            onClick={onSubmit}
            className="w-full"
            data-testid="page-container-footer-next"
          >
            {t('save')}
          </Button>
        ) : (
          <Button
            variant={ButtonVariant.Primary}
            isDisabled={isSaveDisabled}
            onClick={onSubmit}
            size={ButtonSize.Lg}
            isFullWidth
            data-testid="page-container-footer-next"
          >
            {t('save')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

function toHex(value: string): Hex | undefined {
  if (isStrictHexString(value)) {
    return value;
  } else if (/^\d+$/u.test(value)) {
    return `0x${decimalToHex(value)}`;
  }
  return undefined;
}

export default NetworksForm;
