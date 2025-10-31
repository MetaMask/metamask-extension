import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  BoxBorderColor,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { CHAIN_IDS } from '@metamask/transaction-controller';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalContentSize,
  ModalHeader,
  ModalOverlay,
} from '../../../../components/component-library';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/modules/selectors/networks';
import { NetworkListItem } from '../../../../components/multichain/network-list-item';
import { getImageForChainId } from '../../../../selectors/multichain';
import { TextVariant as DsTextVariant } from '../../../../helpers/constants/design-system';

const SUPPORTED_CHAIN_IDS: `0x${string}`[] = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.BASE,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.BSC,
  CHAIN_IDS.SEI,
];

const NetworkSelector = ({
  label,
  modalTitle,
  onNetworkSelect,
  selectedChainId,
}: {
  label: string;
  modalTitle: string;
  onNetworkSelect: (chainId: string) => void;
  selectedChainId: string;
}) => {
  const [showNetworkListMenu, setShowNetworkListMenu] = useState(false);

  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const networksList = useMemo(
    () =>
      Object.values(allNetworks).filter((network) =>
        SUPPORTED_CHAIN_IDS.includes(network.chainId),
      ),
    [allNetworks],
  );

  const selectedNetworkInfo = useMemo(() => {
    return networksList.find((network) => network.chainId === selectedChainId);
  }, [networksList, selectedChainId]);

  return (
    <Box>
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        className="mb-2"
      >
        {label}
      </Text>
      <Box
        asChild
        borderColor={BoxBorderColor.BorderDefault}
        className="w-full flex items-center gap-2 px-4 h-12 border rounded-lg"
        onClick={() => setShowNetworkListMenu(true)}
        aria-label={modalTitle}
      >
        <button data-testid="network-selector-button">
          {selectedNetworkInfo ? (
            <>
              <AvatarNetwork
                src={getImageForChainId(selectedNetworkInfo.chainId)}
                alt={selectedNetworkInfo.name}
                size={AvatarNetworkSize.Sm}
              />
              <Text>{selectedNetworkInfo.name}</Text>
            </>
          ) : (
            <Text color={TextColor.TextAlternative}>{modalTitle}</Text>
          )}

          <Icon
            className="ml-auto"
            size={IconSize.Sm}
            color={IconColor.IconDefault}
            name={IconName.ArrowDown}
          />
        </button>
      </Box>

      <Modal
        isOpen={showNetworkListMenu}
        isClosedOnEscapeKey={true}
        isClosedOnOutsideClick={true}
        onClose={() => setShowNetworkListMenu(false)}
        className="network-selector-modal"
        data-testid="network-selector-modal"
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Sm}>
          <ModalHeader onClose={() => setShowNetworkListMenu(false)}>
            {modalTitle}
          </ModalHeader>
          <ModalBody paddingRight={0} paddingLeft={0}>
            <Box className="flex flex-col w-full">
              {networksList.map((networkConfig) => {
                const { name, chainId } = networkConfig;
                return (
                  <NetworkListItem
                    key={chainId}
                    name={name}
                    selected={selectedChainId === chainId}
                    onClick={() => {
                      onNetworkSelect(chainId);
                      setShowNetworkListMenu(false);
                    }}
                    iconSrc={getImageForChainId(chainId)}
                    iconSize={IconSize.Sm}
                    focus={false}
                    chainId={chainId}
                    variant={DsTextVariant.bodyMdMedium}
                  />
                );
              })}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default NetworkSelector;
