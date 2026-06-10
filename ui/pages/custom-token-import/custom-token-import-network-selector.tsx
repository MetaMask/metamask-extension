import React from 'react';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  Box,
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
import { NetworkListItem } from '../../components/multichain';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getImageForChainId } from '../../selectors/multichain';
import { getNetworkSections } from '../../helpers/utils/network-sections';

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

export const CustomTokenImportNetworkSelector = ({
  isOpen,
  networks,
  selectedNetwork,
  onBack,
  onClose,
  onSelectNetwork,
}: CustomTokenImportNetworkSelectorProps) => {
  const t = useI18nContext();
  const networkSections = getNetworkSections(networks);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      data-testid="custom-token-import-network-selector"
    >
      <ModalOverlay />
      <ModalContent
        padding={0}
        modalDialogProps={{ padding: 0, height: '100%' }}
      >
        <ModalHeader onBack={onBack} onClose={onClose}>
          {t('networkMenuHeading')}
        </ModalHeader>
        <ModalBody
          paddingLeft={0}
          paddingRight={0}
          className="flex min-h-0 flex-1 flex-col overflow-auto"
        >
          {networkSections.map((section, index) => (
            <Box key={section.key} className="flex flex-col">
              {index > 0 ? (
                <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
              ) : null}
              {section.titleKey ? (
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                  fontWeight={FontWeight.Medium}
                  className="px-4 pb-2 pt-4"
                >
                  {t(section.titleKey)}
                </Text>
              ) : null}
              {section.items.map((network) => {
                const chainIdRef = network.chainId as CaipChainId;
                const isSelected = isEvmChainId(chainIdRef)
                  ? formatChainIdToHex(chainIdRef) === selectedNetwork
                  : network.chainId === selectedNetwork;
                return (
                  <NetworkListItem
                    key={network.chainId}
                    chainId={network.chainId}
                    name={network.name}
                    iconSrc={getImageForChainId(network.chainId)}
                    selected={isSelected}
                    onClick={() => onSelectNetwork(network)}
                    focus={false}
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

export default CustomTokenImportNetworkSelector;
