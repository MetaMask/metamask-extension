import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import type { CaipChainId } from '@metamask/utils';
import {
  Display,
  FlexDirection,
  BlockSize,
  AlignItems,
  TextVariant,
  IconColor,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
  Box,
  ButtonLink,
  Checkbox,
  Text,
  AvatarNetworkSize,
  IconName,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NetworkListItem } from '../../network-list-item';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../../selectors/multichain';
import { TEST_CHAINS } from '../../../../../shared/constants/network';
import { getShowTestNetworks } from '../../../../selectors/selectors';

// TODO use MultichainNetworkConfiguration type
type NetworkOption =
  | (NetworkConfiguration & {
      nickname?: string;
    })
  | AddNetworkFields
  | (Omit<NetworkConfiguration, 'chainId'> & { chainId: CaipChainId });

/**
 * AssetPickerModalNetwork component displays a modal for selecting a network in the asset picker.
 *
 * @param props
 * @param props.isOpen - Determines whether the modal is open or not.
 * @param props.network - The currently selected network, not necessarily the active wallet network, and possibly not imported yet.
 * @param props.networks - The list of selectable networks.
 * @param props.onNetworkChange - The callback function to handle network change.
 * @param props.onClose - The callback function to handle modal close.
 * @param props.onBack - The callback function to handle going back in the modal.
 * @param props.shouldDisableNetwork - The callback function to determine if a network should be disabled.
 * @param props.header - A custom header for the modal.
 * @param props.onMultiselectSubmit - The callback function to run when multiple networks are selected.
 * @param props.selectedChainIds - A list of selected chainIds.
 * @param props.isMultiselectEnabled - Determines whether selecting multiple networks is enabled.
 * @returns A modal with a list of selectable networks.
 */
export const AssetPickerModalNetwork = ({
  isOpen,
  onClose,
  onBack,
  network,
  networks,
  onNetworkChange,
  shouldDisableNetwork,
  header,
  isMultiselectEnabled,
  onMultiselectSubmit,
  selectedChainIds,
}: {
  isOpen: boolean;
  network?: NetworkOption;
  networks?: NetworkOption[];
  onNetworkChange: (network: NetworkOption) => void;
  shouldDisableNetwork?: (network: NetworkOption) => boolean;
  onClose: () => void;
  onBack: () => void;
  header?: JSX.Element | string | null;
  isMultiselectEnabled?: boolean;
  selectedChainIds?: string[];
  onMultiselectSubmit?: (selectedChainIds: string[]) => void;
}) => {
  const t = useI18nContext();

  const { balanceByChainId } = useMultichainBalances();

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);
  const showTestnets = useSelector(getShowTestNetworks);
  const currency = useSelector(getCurrentCurrency);
  // Use the networks prop if it is provided, otherwise use all available networks
  // Sort the networks by balance in descending order
  const networksList = useMemo(
    () =>
      (networks ?? Object.values(allNetworks) ?? []).sort(
        (a, b) => balanceByChainId[b.chainId] - balanceByChainId[a.chainId],
      ),
    [],
  );

  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      networksList.reduce(
        ([nonTestNetworksList, testNetworksList], networkDetail) => {
          const isTest = (TEST_CHAINS as string[]).includes(
            networkDetail.chainId,
          );
          (isTest ? testNetworksList : nonTestNetworksList).push(networkDetail);
          return [nonTestNetworksList, testNetworksList];
        },
        [[] as NetworkOption[], [] as NetworkOption[]],
      ),
    [networksList],
  );
  // Tracks the selection/checked state of each network
  // Initialized with the selectedChainIds if provided
  const [checkedChainIds, setCheckedChainIds] = useState<
    Record<string, boolean>
  >(
    networksList?.reduce(
      (acc, { chainId }) => ({
        ...acc,
        [chainId]: selectedChainIds
          ? selectedChainIds.includes(chainId)
          : false,
      }),
      {},
    ) ?? {},
  );

  // Reset checkedChainIds if selectedChainIds change in parent component
  useEffect(() => {
    networksList &&
      setCheckedChainIds(
        networksList.reduce(
          (acc, { chainId }) => ({
            ...acc,
            [chainId]: selectedChainIds
              ? selectedChainIds.includes(chainId)
              : false,
          }),
          {},
        ),
      );
  }, [networksList, selectedChainIds]);

  const handleToggleNetwork = useCallback((chainId: string) => {
    setCheckedChainIds((prev) => ({
      ...prev,
      [chainId]: !prev[chainId],
    }));
  }, []);

  // Toggles all networks to be checked or unchecked
  const handleToggleAllNetworks = useCallback(() => {
    setCheckedChainIds(
      Object.keys(checkedChainIds)?.reduce(
        (agg, chainId) => ({
          ...agg,
          [chainId]: !Object.values(checkedChainIds).every((v) => v),
        }),
        {},
      ),
    );
  }, [checkedChainIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader
          onBack={network ? onBack : undefined}
          onClose={isMultiselectEnabled ? undefined : onClose}
          endAccessory={
            isMultiselectEnabled && selectedChainIds ? (
              <ButtonLink
                variant={TextVariant.bodyMdMedium}
                disabled={Object.values(checkedChainIds).every((v) => !v)}
                onClick={() => {
                  onMultiselectSubmit?.(
                    Object.keys(checkedChainIds).filter(
                      (chainId) => checkedChainIds[chainId],
                    ),
                  );
                  onBack();
                }}
              >
                {t('apply')}
              </ButtonLink>
            ) : undefined
          }
        >
          {header ?? t('bridgeSelectNetwork')}
        </ModalHeader>
        {isMultiselectEnabled && (
          <Box display={Display.Flex} padding={4}>
            <Checkbox
              isIndeterminate={Object.values(checkedChainIds).every((v) => v)}
              iconProps={{
                name: Object.values(checkedChainIds).some((v) => !v)
                  ? IconName.MinusBold
                  : IconName.Add,
                color: IconColor.primaryInverse,
                backgroundColor: BackgroundColor.primaryDefault,
              }}
              isChecked
              onChange={() => {
                handleToggleAllNetworks();
              }}
            />
            <ButtonLink
              variant={TextVariant.bodyMdMedium}
              onClick={() => {
                handleToggleAllNetworks();
              }}
              style={{
                alignSelf: AlignItems.flexStart,
                paddingInline: 16,
              }}
            >
              {t('selectAll')}
            </ButtonLink>
          </Box>
        )}
        <Box
          className="multichain-asset-picker__network-list"
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
        >
          {testNetworks.length > 0 ? (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              padding={4}
            >
              {t('enabledNetworks')}
            </Text>
          ) : null}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
          >
            {nonTestNetworks.map((networkConfig) => {
              const { name, chainId } = networkConfig;
              return (
                <NetworkListItem
                  key={chainId}
                  name={
                    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                      chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                    ] ?? name
                  }
                  selected={
                    // If multiselect is enabled, the checkbox indicates selection
                    isMultiselectEnabled ? false : network?.chainId === chainId
                  }
                  onClick={() => {
                    if (isMultiselectEnabled) {
                      handleToggleNetwork(chainId);
                      return;
                    }
                    onNetworkChange(networkConfig);
                    onBack();
                  }}
                  iconSrc={getImageForChainId(chainId)}
                  iconSize={AvatarNetworkSize.Sm}
                  focus={false}
                  disabled={shouldDisableNetwork?.(networkConfig)}
                  startAccessory={
                    isMultiselectEnabled ? (
                      <Checkbox
                        isChecked={checkedChainIds[chainId]}
                        name={chainId}
                      />
                    ) : undefined
                  }
                  chainId={chainId}
                  showEndAccessory={isMultiselectEnabled}
                  variant={TextVariant.bodyMdMedium}
                  endAccessory={
                    isMultiselectEnabled ? (
                      <Text variant={TextVariant.bodyMdMedium}>
                        {formatCurrency(
                          balanceByChainId[chainId]?.toString(),
                          currency,
                        )}
                      </Text>
                    ) : undefined
                  }
                />
              );
            })}
          </Box>
        </Box>
        {showTestnets && testNetworks.length > 0 ? (
          <Box
            className="multichain-asset-picker__network-list"
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <Box padding={4}>
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.textAlternative}
              >
                {t('testNetworks')}
              </Text>
            </Box>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
            >
              {testNetworks.map((networkConfig) => {
                const { name, chainId } = networkConfig;
                return (
                  <NetworkListItem
                    key={chainId}
                    name={
                      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                        chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                      ] ?? name
                    }
                    selected={
                      // If multiselect is enabled, the checkbox indicates selection
                      isMultiselectEnabled
                        ? false
                        : network?.chainId === chainId
                    }
                    onClick={() => {
                      if (isMultiselectEnabled) {
                        handleToggleNetwork(chainId);
                        return;
                      }
                      onNetworkChange(networkConfig);
                      onBack();
                    }}
                    iconSrc={getImageForChainId(chainId)}
                    iconSize={AvatarNetworkSize.Sm}
                    focus={false}
                    disabled={shouldDisableNetwork?.(networkConfig)}
                    startAccessory={
                      isMultiselectEnabled ? (
                        <Checkbox
                          isChecked={checkedChainIds[chainId]}
                          name={chainId}
                        />
                      ) : undefined
                    }
                    showEndAccessory={isMultiselectEnabled}
                    variant={TextVariant.bodyMdMedium}
                    endAccessory={
                      isMultiselectEnabled ? (
                        <Text variant={TextVariant.bodyMdMedium}>
                          {formatCurrency(
                            balanceByChainId[chainId]?.toString(),
                            currency,
                          )}
                        </Text>
                      ) : undefined
                    }
                  />
                );
              })}
            </Box>
          </Box>
        ) : null}
      </ModalContent>
    </Modal>
  );
};
