import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';
import {
  AddNetworkFields,
  NetworkConfiguration,
} from '@metamask/network-controller';
import type { CaipChainId } from '@metamask/utils';
import {
  AvatarNetworkSize,
  Checkbox,
  FontWeight,
  IconName,
  Text as DsText,
  TextColor as DsTextColor,
  TextVariant as DsTextVariant,
} from '@metamask/design-system-react';
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
  ModalBody,
  Modal,
  Box,
  ButtonLink,
  Text,
} from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { NetworkListItem } from '../../network-list-item';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../../selectors/multichain';
import { getShowTestNetworks } from '../../../../selectors/selectors';
import { getNetworkSections } from '../../../../helpers/utils/network-sections';

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
    [allNetworks, balanceByChainId, networks],
  );

  const networkSections = useMemo(
    () =>
      getNetworkSections(
        networksList,
        (networkA, networkB) =>
          (balanceByChainId[networkB.chainId] ?? 0) -
          (balanceByChainId[networkA.chainId] ?? 0),
      ).filter((section) => showTestnets || section.key !== 'test'),
    [balanceByChainId, networksList, showTestnets],
  );
  // Tracks the selection/checked state of each network
  // Initialized with the selectedChainIds if provided
  const [checkedChainIds, setCheckedChainIds] = useState<
    Record<string, boolean>
  >(() => {
    if (!networksList) {
      return {};
    }

    const initialState: Record<string, boolean> = {};

    for (const { chainId } of networksList) {
      initialState[chainId] = selectedChainIds
        ? selectedChainIds.includes(chainId)
        : false;
    }

    return initialState;
  });

  // Reset checkedChainIds if selectedChainIds change in parent component
  useEffect(() => {
    if (networksList) {
      const updatedState: Record<string, boolean> = {};

      for (const { chainId } of networksList) {
        updatedState[chainId] = selectedChainIds
          ? selectedChainIds.includes(chainId)
          : false;
      }

      setCheckedChainIds(updatedState);
    }
  }, [networksList, selectedChainIds]);

  const handleToggleNetwork = useCallback((chainId: string) => {
    setCheckedChainIds((prev) => ({
      ...prev,
      [chainId]: !prev[chainId],
    }));
  }, []);

  // Toggles all networks to be checked or unchecked
  const handleToggleAllNetworks = useCallback(() => {
    const toggledState: Record<string, boolean> = {};
    const allChecked = Object.values(checkedChainIds).every((v) => v);

    for (const chainId of Object.keys(checkedChainIds)) {
      toggledState[chainId] = !allChecked;
    }

    setCheckedChainIds(toggledState);
  }, [checkedChainIds]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent
        padding={0}
        modalDialogProps={{ padding: 0, height: BlockSize.Full }}
      >
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
              id="asset-picker-network-select-all"
              isSelected
              checkedIconProps={{
                name: Object.values(checkedChainIds).some((v) => !v)
                  ? IconName.MinusBold
                  : IconName.Add,
              }}
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
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          className="multichain-asset-picker__network-list flex min-h-0 flex-1 flex-col overflow-auto"
        >
          {networkSections.map((section, index) => (
            <Box
              key={section.key}
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
              className="flex flex-col"
            >
              {index > 0 ? (
                <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
              ) : null}
              {section.titleKey ? (
                <DsText
                  variant={DsTextVariant.BodyMd}
                  color={DsTextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                  className="px-4 pb-2 pt-4"
                >
                  {t(section.titleKey)}
                </DsText>
              ) : null}
              {section.items.map((networkConfig) => {
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
                          id={`asset-picker-network-checkbox-${chainId}`}
                          isSelected={checkedChainIds[chainId]}
                          onChange={() => handleToggleNetwork(chainId)}
                          onClick={(event) => event.stopPropagation()}
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
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
