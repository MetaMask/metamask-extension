import React from 'react';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../components/component-library';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getImageForChainId } from '../../selectors/multichain';

export type CustomTokenImportNetworkOption = {
  chainId: string;
  name: string;
};

export type CustomTokenImportNetworkSelectorProps = {
  isOpen: boolean;
  networks: CustomTokenImportNetworkOption[];
  selectedNetwork: string;
  onBack: () => void;
  onClose: () => void;
  onSelectNetwork: (network: CustomTokenImportNetworkOption) => void;
};

const NetworkRow = ({
  network,
  isSelected,
  onSelect,
}: {
  network: CustomTokenImportNetworkOption;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <Box
    asChild
    flexDirection={BoxFlexDirection.Row}
    alignItems={BoxAlignItems.Center}
    gap={4}
    paddingHorizontal={4}
    paddingVertical={3}
    backgroundColor={
      isSelected ? BoxBackgroundColor.BackgroundMuted : undefined
    }
    className="w-full text-left transition-colors hover:bg-muted-hover active:bg-muted-pressed"
  >
    <button
      type="button"
      data-testid={`select-network-item-${network.chainId}`}
      aria-current={isSelected ? 'true' : undefined}
      onClick={onSelect}
    >
      <AvatarNetwork
        name={network.name}
        src={getImageForChainId(network.chainId)}
        size={AvatarNetworkSize.Sm}
      />
      <Text
        asChild
        variant={TextVariant.BodyMd}
        color={TextColor.TextDefault}
        fontWeight={isSelected ? FontWeight.Medium : FontWeight.Regular}
        ellipsis
      >
        <span className="min-w-0 flex-1">{network.name}</span>
      </Text>
    </button>
  </Box>
);

export const CustomTokenImportNetworkSelector = ({
  isOpen,
  networks,
  selectedNetwork,
  onBack,
  onClose,
  onSelectNetwork,
}: CustomTokenImportNetworkSelectorProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      data-testid="custom-token-import-network-selector"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onBack={onBack} onClose={onClose}>
          {t('networkMenuHeading')}
        </ModalHeader>
        <ModalBody paddingLeft={0} paddingRight={0}>
          {networks.map((network) => {
            const chainIdRef = network.chainId as CaipChainId;
            const isSelected = isEvmChainId(chainIdRef)
              ? formatChainIdToHex(chainIdRef) === selectedNetwork
              : network.chainId === selectedNetwork;
            return (
              <NetworkRow
                key={network.chainId}
                network={network}
                isSelected={isSelected}
                onSelect={() => onSelectNetwork(network)}
              />
            );
          })}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default CustomTokenImportNetworkSelector;
