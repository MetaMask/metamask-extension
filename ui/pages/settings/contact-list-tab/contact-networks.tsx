import React, { useEffect, useMemo, useState } from 'react';

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
} from '../../../helpers/constants/design-system';
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
} from '../../../components/component-library';
import { getMultichainNetworkConfigurationsByChainId } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { NetworkListItem } from '../../../components/multichain';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { TEST_CHAINS } from '../../../../shared/constants/network';

// TODO use MultichainNetworkConfiguration type
type NetworkOption =
  | NetworkConfiguration
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
export const ContactNetworks = ({
  isOpen,
  onClose,
  onBack,
  network,
  selectedChainId,
  onSelect,
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
  selectedChainId?: string;
  onSelect?: (chainName: string) => void;
}) => {
  const t = useI18nContext();

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const [nonTestNetworks, testNetworks] = useMemo(
    () =>
      Object.entries(networkConfigurations).reduce(
        ([nonTestNetworksList, testNetworksList], [chainId, network]) => {
          const isTest = (TEST_CHAINS as string[]).includes(chainId);
          (isTest ? testNetworksList : nonTestNetworksList).push(network);
          return [nonTestNetworksList, testNetworksList];
        },
        [[] as NetworkConfiguration[], [] as NetworkConfiguration[]],
      ),
    [networkConfigurations],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onBack={onClose} onClose={onClose}>
          {t('bridgeSelectNetwork')}
        </ModalHeader>
        <Box
          className="multichain-asset-picker__network-list"
          display={Display.Flex}
        >
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
                  selected={selectedChainId === chainId}
                  onClick={() => onSelect?.(chainId)}
                  iconSrc={getImageForChainId(chainId)}
                  iconSize={AvatarNetworkSize.Sm}
                  focus={false}
                  variant={TextVariant.bodyMdMedium}
                />
              );
            })}
            <Text>{t('testNetworks')}</Text>
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
                  selected={selectedChainId === chainId}
                  onClick={() => onSelect?.(chainId)}
                  iconSrc={getImageForChainId(chainId)}
                  iconSize={AvatarNetworkSize.Sm}
                  focus={false}
                  variant={TextVariant.bodyMdMedium}
                />
              );
            })}
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
