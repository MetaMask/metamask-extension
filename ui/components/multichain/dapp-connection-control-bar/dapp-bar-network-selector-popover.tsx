import React, { useCallback, useContext, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type Hex } from '@metamask/utils';
import { type MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  Box,
  BoxAlignItems,
  BoxBorderColor,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  AvatarNetworkSize,
  Popover,
  PopoverPosition,
  PopoverRole,
} from '../../component-library';
import ToggleButton from '../../ui/toggle-button';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NetworkListItem } from '../network-list-item';
import {
  getAllDomains,
  getMultichainNetworkConfigurationsByChainId,
  getOrderedNetworksList,
  getOriginOfCurrentTab,
  getPermittedEVMChainsForSelectedTab,
  getShowTestNetworks,
  getAllChainsToPoll,
} from '../../../selectors';
import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import {
  addPermittedChain,
  detectNfts,
  setActiveNetwork,
  setNetworkClientIdForDomain,
  setNextNonce,
  setShowTestNetworks,
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
import { TEST_CHAINS } from '../../../../shared/constants/network';
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
export const DappBarEVMNetworkSelectorPopover: React.FC<
  DappBarNetworkSelectorPopoverProps
> = ({ referenceElement, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
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

  const activeDappChainId = dappActiveNetwork
    ? (dappActiveNetwork.chainId as Hex)
    : undefined;

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
    ? TEST_CHAINS.includes(activeDappChainId)
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

  const handleSelectNetwork = useCallback(
    async (network: MultichainNetworkConfiguration) => {
      const hexChainId = convertCaipToHexChainId(network.chainId);

      if (hexChainId === activeDappChainId) {
        onClose();
        return;
      }

      try {
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

  const handleToggleTestNetworks = useCallback(
    (currentValue: boolean) => {
      // Don't allow disabling while actively on a testnet - mirrors the
      // network-list-menu behavior so the user can't hide their own selection.
      if (currentlyOnTestnet) {
        return;
      }
      const newValue = !currentValue;
      dispatch(setShowTestNetworks(newValue));
      trackEvent({
        event: MetaMetricsEventName.TestNetworksDisplayed,
        category: MetaMetricsEventCategory.Network,
        properties: { value: newValue },
      });
    },
    [dispatch, trackEvent, currentlyOnTestnet],
  );

  return (
    <Popover
      referenceElement={referenceElement}
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
      className="dapp-bar-network-selector-popover"
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Stretch}
        className="w-full"
        style={{ maxHeight: `${POPOVER_MAX_HEIGHT}px` }}
      >
        {/* Sticky header: compact test-networks toggle. Stays in view while the
            network list below scrolls. */}
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Between}
          gap={2}
          paddingTop={2}
          paddingBottom={2}
          paddingLeft={4}
          borderColor={BoxBorderColor.BorderMuted}
          className="shrink-0 border-x-0 border-t-0 border-b"
          data-testid="dapp-bar-network-selector-popover__testnet-toggle-row"
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('showTestnetNetworks')}
          </Text>
          <ToggleButton
            dataTestId="dapp-bar-network-selector-popover__testnet-toggle"
            value={showTestnets || currentlyOnTestnet}
            disabled={currentlyOnTestnet}
            onToggle={handleToggleTestNetworks}
          />
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Stretch}
          paddingTop={1}
          paddingBottom={1}
          className="w-full grow basis-auto overflow-y-auto"
          data-testid="dapp-bar-network-selector-popover__list"
        >
          {visibleNetworks.map((network) => {
            const isSelected =
              convertCaipToHexChainId(network.chainId) === activeDappChainId;
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
                      size={IconSize.Xl}
                      color={IconColor.IconDefault}
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
      </Box>
    </Popover>
  );
};
