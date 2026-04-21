import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  type CaipChainId,
  type Hex,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import {
  type MultichainNetworkConfiguration,
  NON_EVM_TESTNET_IDS,
} from '@metamask/multichain-network-controller';
import { toHex } from '@metamask/controller-utils';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  AvatarNetworkSize,
  Box,
  Icon,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
  PopoverRole,
} from '../../component-library';
import { NetworkListItem } from '../network-list-item';
import {
  getAllDomains,
  getMultichainNetworkConfigurationsByChainId,
  getOrderedNetworksList,
  getOriginOfCurrentTab,
  getPermittedEVMChainsForSelectedTab,
  getPreferences,
  getShowTestNetworks,
  getAllChainsToPoll,
} from '../../../selectors';
import {
  addPermittedChain,
  detectNfts,
  setActiveNetwork,
  setNetworkClientIdForDomain,
  setNextNonce,
  setTokenNetworkFilter,
  showPermittedNetworkToast,
  updateCustomNonce,
} from '../../../store/actions';
import { getDappActiveNetwork } from '../../../selectors/dapp';
import {
  convertCaipToHexChainId,
  getNetworkIcon,
  getRpcDataByChainId,
  sortNetworks,
} from '../../../../shared/lib/network.utils';
import {
  TEST_CHAINS,
  CAIP_FORMATTED_TEST_CHAINS,
} from '../../../../shared/constants/network';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

type DappBarNetworkSelectorPopoverProps = {
  referenceElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
};

const POPOVER_MAX_HEIGHT = 320;
const POPOVER_WIDTH = 280;

/**
 * Inline popover anchored to the Dapp Connection Control Bar's network
 * selector. Lists the user's enabled EVM networks and switches the dapp's
 * active network on selection, preserving per-origin permissions behavior.
 *
 * @param props - The component props.
 * @param props.referenceElement - The DOM element the popover anchors to
 * (typically the network button in the Dapp Connection Control Bar).
 * @param props.isOpen - Whether the popover is currently open.
 * @param props.onClose - Callback fired when the popover should close
 * (click-outside, Esc key, or after a network is selected).
 */
export const DappBarNetworkSelectorPopover: React.FC<
  DappBarNetworkSelectorPopoverProps
> = ({ referenceElement, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { trackEvent } = useContext(MetaMetricsContext);

  const selectedTabOrigin = useSelector(getOriginOfCurrentTab);
  const domains = useSelector(getAllDomains);
  const orderedNetworksList = useSelector(getOrderedNetworksList);
  const showTestnets = useSelector(getShowTestNetworks);
  const dappActiveNetwork = useSelector(getDappActiveNetwork);
  const [multichainNetworks, evmNetworks] = useSelector(
    getMultichainNetworkConfigurationsByChainId,
  );
  const permittedChainIds = useSelector((state) =>
    getPermittedEVMChainsForSelectedTab(state, selectedTabOrigin),
  );
  const { tokenNetworkFilter } = useSelector(getPreferences);
  const allChainIds = useSelector(getAllChainsToPoll);

  const activeDappChainId = dappActiveNetwork?.chainId as
    | CaipChainId
    | undefined;

  // Partition into EVM non-test vs EVM test networks. Non-EVM is intentionally
  // excluded: the dapp control bar is EVM-scoped today.
  const [nonTestEvmNetworks, testEvmNetworks] = useMemo(() => {
    const nonTest: MultichainNetworkConfiguration[] = [];
    const test: MultichainNetworkConfiguration[] = [];
    for (const network of Object.values(multichainNetworks)) {
      if (!network.isEvm) {
        continue;
      }
      const hexChainId = convertCaipToHexChainId(network.chainId);
      const isTest = TEST_CHAINS.includes(hexChainId as Hex);
      (isTest ? test : nonTest).push(network);
    }
    return [nonTest, test];
  }, [multichainNetworks]);

  // Keyed record expected by sortNetworks (keyed by hex chainId for EVM).
  const nonTestEvmNetworksByKey = useMemo(() => {
    return nonTestEvmNetworks.reduce<
      Record<string, MultichainNetworkConfiguration>
    >((acc, network) => {
      acc[convertCaipToHexChainId(network.chainId)] = network;
      return acc;
    }, {});
  }, [nonTestEvmNetworks]);

  const orderedNetworks = useMemo(
    () => sortNetworks(nonTestEvmNetworksByKey, orderedNetworksList),
    [nonTestEvmNetworksByKey, orderedNetworksList],
  );

  const currentlyOnTestnet = activeDappChainId
    ? CAIP_FORMATTED_TEST_CHAINS.includes(activeDappChainId) ||
      NON_EVM_TESTNET_IDS.includes(activeDappChainId)
    : false;

  // Only include test networks when the global "Show test networks" toggle is
  // on, or when the dapp is already on a testnet (so the user can see the
  // current selection).
  const visibleNetworks = useMemo(() => {
    if (showTestnets || currentlyOnTestnet) {
      return [...orderedNetworks, ...testEvmNetworks];
    }
    return orderedNetworks;
  }, [orderedNetworks, testEvmNetworks, showTestnets, currentlyOnTestnet]);

  const isSameChain = useCallback((a?: string, b?: string) => {
    if (!a || !b) {
      return false;
    }
    if (a === b) {
      return true;
    }
    // Handle cases where one side is CAIP (eip155:1) and the other is hex (0x1).
    try {
      const normalize = (chainId: string) => {
        if (chainId.startsWith('0x')) {
          return chainId.toLowerCase();
        }
        const { namespace, reference } = parseCaipChainId(
          chainId as CaipChainId,
        );
        if (namespace !== KnownCaipNamespace.Eip155) {
          return chainId;
        }
        return toHex(reference);
      };
      return normalize(a) === normalize(b);
    } catch {
      return false;
    }
  }, []);

  const handleSelectNetwork = useCallback(
    async (network: MultichainNetworkConfiguration) => {
      // Always close the popover after a selection (or no-op selection).
      if (isSameChain(network.chainId, activeDappChainId)) {
        onClose();
        return;
      }

      try {
        const hexChainId = convertCaipToHexChainId(network.chainId);
        const { defaultRpcEndpoint } = getRpcDataByChainId(
          network.chainId,
          evmNetworks,
        );
        const finalNetworkClientId = defaultRpcEndpoint.networkClientId;

        if (selectedTabOrigin && domains[selectedTabOrigin]) {
          const isNetworkPermitted = permittedChainIds.includes(hexChainId);

          if (!isNetworkPermitted) {
            await dispatch(
              addPermittedChain(selectedTabOrigin, network.chainId),
            );
            dispatch(showPermittedNetworkToast());
          }

          await setNetworkClientIdForDomain(
            selectedTabOrigin,
            finalNetworkClientId,
          );
        }

        dispatch(setActiveNetwork(finalNetworkClientId));
        dispatch(updateCustomNonce(''));
        dispatch(setNextNonce(''));
        dispatch(detectNfts(allChainIds));

        if (Object.keys(tokenNetworkFilter || {}).length <= 1) {
          dispatch(setTokenNetworkFilter({ [hexChainId]: true }));
        } else {
          const allOpts = Object.keys(evmNetworks).reduce<
            Record<string, boolean>
          >((acc, id) => {
            acc[id] = true;
            return acc;
          }, {});
          dispatch(setTokenNetworkFilter(allOpts));
        }

        trackEvent({
          event: MetaMetricsEventName.NavNetworkSwitched,
          category: MetaMetricsEventCategory.Network,
          properties: {
            location: 'Dapp Connection Control Bar',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: hexChainId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            from_network: activeDappChainId,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            to_network: hexChainId,
          },
        });
      } finally {
        onClose();
      }
    },
    [
      isSameChain,
      activeDappChainId,
      evmNetworks,
      selectedTabOrigin,
      domains,
      permittedChainIds,
      dispatch,
      allChainIds,
      tokenNetworkFilter,
      trackEvent,
      onClose,
    ],
  );

  return (
    <Popover
      referenceElement={referenceElement ?? undefined}
      isOpen={isOpen}
      onClickOutside={onClose}
      onPressEscKey={onClose}
      position={PopoverPosition.TopEnd}
      role={PopoverRole.Dialog}
      offset={[0, 8]}
      flip
      preventOverflow
      padding={0}
      referenceHidden={false}
      data-testid="dapp-bar-network-selector-popover"
      style={{
        width: `${POPOVER_WIDTH}px`,
        zIndex: 200,
      }}
      className="dapp-bar-network-selector-popover"
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.stretch}
        width={BlockSize.Full}
        style={{
          maxHeight: `${POPOVER_MAX_HEIGHT}px`,
          overflowY: 'auto',
          paddingTop: 4,
          paddingBottom: 4,
        }}
        data-testid="dapp-bar-network-selector-popover__list"
      >
        {visibleNetworks.map((network) => {
          const isSelected = isSameChain(network.chainId, activeDappChainId);
          return (
            <NetworkListItem
              key={network.chainId}
              chainId={network.chainId}
              name={network.name}
              iconSrc={getNetworkIcon(network)}
              iconSize={AvatarNetworkSize.Sm}
              selected={isSelected}
              focus={false}
              showEndAccessory={isSelected}
              endAccessory={
                isSelected ? (
                  <Icon
                    name={IconName.Check}
                    size={IconSize.Sm}
                    color={IconColor.primaryDefault}
                    data-testid={`dapp-bar-network-selector-popover__selected-${network.chainId}`}
                  />
                ) : undefined
              }
              onClick={() => {
                handleSelectNetwork(network);
              }}
            />
          );
        })}
      </Box>
    </Popover>
  );
};
