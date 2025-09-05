import React, { useCallback, useState, useMemo } from 'react';

import {
  Box,
  ButtonBase,
  ButtonBaseSize,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalContentSize,
  IconName,
  IconSize,
  Text,
  AvatarNetwork,
  AvatarNetworkSize,
  Icon,
  ButtonIconSize,
  ButtonIcon,
} from '../../../../../components/component-library';
import {
  BackgroundColor,
  TextColor,
  Display,
  AlignItems,
  BorderColor,
} from '../../../../../helpers/constants/design-system';
import { NetworkListItem } from '../../../../../components/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../utils/network';
import { type Asset } from '../../../types/send';

type NetworkFilterProps = {
  tokens: Asset[];
  nfts: Asset[];
  selectedChainId?: string | null;
  onChainIdChange?: (chainId: string | null) => void;
};

export const NetworkFilter = ({
  tokens,
  nfts,
  selectedChainId = null, // Default to "All networks"
  onChainIdChange,
}: NetworkFilterProps) => {
  const t = useI18nContext();
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);

  // Extract and sort unique chain IDs by total fiat balance from tokens only
  const uniqueChainIds = useMemo(() => {
    const chainIds = new Set<string>();
    const chainIdBalances = new Map<string, number>();

    // Calculate total fiat balance for each chain from tokens only
    tokens.forEach((token) => {
      if (token.chainId) {
        const chainId = String(token.chainId);
        chainIds.add(chainId);

        if (token.fiat?.balance) {
          const currentTotal = chainIdBalances.get(chainId) || 0;
          chainIdBalances.set(chainId, currentTotal + token.fiat.balance);
        }
      }
    });

    // Add chain IDs from NFTs but don't include their fiat balance in sorting
    nfts.forEach((nft) => {
      if (nft.chainId) {
        chainIds.add(String(nft.chainId));
      }
    });

    // Sort chain IDs by total fiat balance (descending - highest first)
    return Array.from(chainIds).sort((chainIdA, chainIdB) => {
      const balanceA = chainIdBalances.get(chainIdA) || 0;
      const balanceB = chainIdBalances.get(chainIdB) || 0;
      return balanceB - balanceA;
    });
  }, [tokens, nfts]);

  const { displayName, displayIcon, isAllNetworks } = useMemo(() => {
    if (selectedChainId === null) {
      return {
        displayName: 'All networks',
        displayIcon: IconName.Global,
        isAllNetworks: true,
      };
    }

    const networkName =
      NETWORK_TO_SHORT_NETWORK_NAME_MAP[
        selectedChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
      ];

    return {
      displayName: networkName || `Chain ${selectedChainId}`,
      displayIcon: getImageForChainId(selectedChainId),
      isAllNetworks: false,
    };
  }, [selectedChainId]);

  const handleNetworkFilterClick = useCallback(() => {
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  }, [isNetworkFilterPopoverOpen]);

  const closePopover = useCallback(() => {
    setIsNetworkFilterPopoverOpen(false);
  }, []);

  const handleNetworkSelection = useCallback(
    (chainId: string | null) => {
      onChainIdChange?.(chainId);
      closePopover();
    },
    [onChainIdChange, closePopover],
  );

  return (
    <>
      <Box marginLeft={4} marginBottom={2}>
        <ButtonBase
          data-testid="send-network-filter-toggle"
          onClick={handleNetworkFilterClick}
          size={ButtonBaseSize.Md}
          endIconName={IconName.ArrowDown}
          backgroundColor={BackgroundColor.backgroundDefault}
          color={TextColor.textDefault}
          borderColor={BorderColor.borderDefault}
          marginBottom={2}
          marginTop={2}
          ellipsis
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={2}>
            {isAllNetworks ? (
              <Icon name={displayIcon as IconName} size={IconSize.Sm} />
            ) : (
              <AvatarNetwork
                name={displayName}
                src={displayIcon}
                size={AvatarNetworkSize.Sm}
                borderWidth={0}
              />
            )}
            <Text ellipsis>{displayName}</Text>
          </Box>
        </ButtonBase>
      </Box>
      <Modal
        isOpen={isNetworkFilterPopoverOpen}
        onClose={closePopover}
        isClosedOnOutsideClick={true}
        isClosedOnEscapeKey={true}
      >
        <ModalOverlay />
        <ModalContent size={ModalContentSize.Md}>
          <ModalHeader
            endAccessory={
              <ButtonIcon
                ariaLabel="Close recipient modal"
                data-testid="close-recipient-modal-btn"
                iconName={IconName.Close}
                onClick={closePopover}
                size={ButtonIconSize.Sm}
              />
            }
          >
            {t('selectNetworkToFilter')}
          </ModalHeader>
          <ModalBody>
            <NetworkListItem
              name={t('allNetworks')}
              iconSrc={IconName.Global}
              iconSize={IconSize.Xl}
              selected={selectedChainId === null}
              onClick={() => handleNetworkSelection(null)}
            />
            {uniqueChainIds.map((chainId) => {
              const networkName =
                NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                  chainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                ];

              return (
                <NetworkListItem
                  key={chainId}
                  name={networkName || `Chain ${chainId}`}
                  iconSrc={getImageForChainId(chainId)}
                  selected={selectedChainId === chainId}
                  onClick={() => handleNetworkSelection(chainId)}
                />
              );
            })}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
