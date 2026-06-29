import React, { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

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
  ButtonIconSize,
  ButtonIcon,
} from '../../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  TextColor,
  BorderColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { NetworkListItem } from '../../../../../components/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useAssetSelectionMetrics } from '../../../hooks/send/metrics/useAssetSelectionMetrics';
import { useChainNetworkNameAndImageMap } from '../../../hooks/useChainNetworkNameAndImage';
import { AssetFilterMethod } from '../../../context/send-metrics';
import { type Asset } from '../../../types/send';
import { getNetworkSections } from '../../../../../helpers/utils/network-sections';
import { getIsNetworkManagementEnabled } from '../../../../../selectors/multichain/feature-flags';
import {
  NetworkSelectionModal,
  type NetworkSelectionSection,
} from '../../../../../components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal';

type NetworkFilterProps = {
  tokens: Asset[];
  nfts: Asset[];
  selectedChainId?: string | null;
  onChainIdChange?: (chainId: string | null) => void;
};

type ChainNetworkDetails = {
  networkName?: string;
  networkImage?: string;
};

function getNetworkSelectionItem({
  chainId,
  selectedChainId,
  chainNetworkDetails,
  handleNetworkSelection,
}: {
  chainId: string;
  selectedChainId: string | null;
  chainNetworkDetails?: ChainNetworkDetails;
  handleNetworkSelection: (chainId: string | null) => void;
}): NetworkSelectionSection['items'][number] {
  return {
    key: chainId,
    chainId,
    name: chainNetworkDetails?.networkName || `Chain ${chainId}`,
    iconSrc: chainNetworkDetails?.networkImage || '',
    selected: selectedChainId === chainId,
    onClick: () => handleNetworkSelection(chainId),
    testId: `send-network-filter-${chainId}`,
  };
}

export const NetworkFilter = ({
  tokens,
  nfts,
  selectedChainId = null, // Default to "All networks"
  onChainIdChange,
}: NetworkFilterProps) => {
  const t = useI18nContext();
  const isNetworkManagementEnabled = useSelector(getIsNetworkManagementEnabled);
  const [isNetworkFilterPopoverOpen, setIsNetworkFilterPopoverOpen] =
    useState(false);
  const { addAssetFilterMethod, removeAssetFilterMethod } =
    useAssetSelectionMetrics();
  const chainNetworkNAmeAndImageMap = useChainNetworkNameAndImageMap();

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

  const displayName = useMemo(() => {
    if (selectedChainId === null) {
      return t('allNetworks');
    }

    const networkName = chainNetworkNAmeAndImageMap.get(
      selectedChainId as string,
    )?.networkName;

    return networkName || `Chain ${selectedChainId}`;
  }, [selectedChainId, chainNetworkNAmeAndImageMap, t]);

  const isSingleNetworkSelected = selectedChainId !== null;

  const handleNetworkFilterClick = useCallback(() => {
    setIsNetworkFilterPopoverOpen((isOpen) => !isOpen);
  }, []);

  const closePopover = useCallback(() => {
    setIsNetworkFilterPopoverOpen(false);
  }, []);

  const handleNetworkSelection = useCallback(
    (chainId: string | null) => {
      if (chainId === null) {
        removeAssetFilterMethod(AssetFilterMethod.Network);
      } else {
        addAssetFilterMethod(AssetFilterMethod.Network);
      }

      onChainIdChange?.(chainId);
      closePopover();
    },
    [
      addAssetFilterMethod,
      closePopover,
      onChainIdChange,
      removeAssetFilterMethod,
    ],
  );

  // Group the networks the user holds assets on into Default / Custom / Testnets
  // sections (sorted by fiat balance within each), so custom networks such as
  // newly added chains surface under the "Custom networks" header.
  const networkSections = useMemo(
    () =>
      getNetworkSections(
        uniqueChainIds.map((chainId) => ({
          chainId,
          balance: tokens
            .filter((token) => String(token.chainId) === chainId)
            .reduce((total, token) => total + (token.fiat?.balance ?? 0), 0),
        })),
        (networkA, networkB) => networkB.balance - networkA.balance,
      ),
    [tokens, uniqueChainIds],
  );

  const sharedModalSections = useMemo<NetworkSelectionSection[]>(
    () =>
      networkSections.map((section) => ({
        key: section.key,
        title: section.titleKey ? t(section.titleKey) : undefined,
        items: section.items.map(({ chainId }) =>
          getNetworkSelectionItem({
            chainId,
            selectedChainId,
            chainNetworkDetails: chainNetworkNAmeAndImageMap.get(chainId),
            handleNetworkSelection,
          }),
        ),
      })),
    [
      chainNetworkNAmeAndImageMap,
      handleNetworkSelection,
      networkSections,
      selectedChainId,
      t,
    ],
  );

  return (
    <>
      <Box marginLeft={4} marginBottom={2}>
        <ButtonBase
          data-testid="send-network-filter-toggle"
          onClick={handleNetworkFilterClick}
          size={ButtonBaseSize.Sm}
          startIconName={IconName.Filter}
          startIconProps={{ marginInlineEnd: 1, size: IconSize.Md }}
          className="hover:bg-hover active:bg-pressed"
          backgroundColor={BackgroundColor.backgroundDefault}
          borderRadius={BorderRadius.LG}
          color={
            isSingleNetworkSelected
              ? TextColor.primaryDefault
              : TextColor.textDefault
          }
          borderColor={BorderColor.borderMuted}
          paddingLeft={2}
          paddingRight={2}
          marginBottom={2}
          marginTop={2}
          ellipsis
        >
          <Text
            variant={TextVariant.bodySmMedium}
            color={
              isSingleNetworkSelected
                ? TextColor.primaryDefault
                : TextColor.textDefault
            }
            ellipsis
          >
            {displayName}
          </Text>
        </ButtonBase>
      </Box>
      {isNetworkManagementEnabled ? (
        <NetworkSelectionModal
          isOpen={isNetworkFilterPopoverOpen}
          onClose={closePopover}
          title={t('bridgeSelectNetwork')}
          topItem={{
            key: 'all-networks',
            name: t('allNetworks'),
            iconSrc: IconName.Global,
            selected: selectedChainId === null,
            onClick: () => handleNetworkSelection(null),
            testId: 'send-network-filter-all-networks',
          }}
          sections={sharedModalSections}
        />
      ) : (
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
            <ModalBody paddingLeft={0} paddingRight={0}>
              <NetworkListItem
                name={t('allNetworks')}
                iconSrc={IconName.Global}
                iconSize={IconSize.Xl}
                selected={selectedChainId === null}
                onClick={() => handleNetworkSelection(null)}
                focus={false}
              />
              {uniqueChainIds.map((chainId) => {
                const networkName = chainNetworkNAmeAndImageMap.get(
                  chainId as string,
                )?.networkName;
                const networkImage = chainNetworkNAmeAndImageMap.get(
                  chainId as string,
                )?.networkImage;

                return (
                  <NetworkListItem
                    key={chainId}
                    name={networkName || `Chain ${chainId}`}
                    iconSrc={networkImage || ''}
                    selected={selectedChainId === chainId}
                    onClick={() => handleNetworkSelection(chainId)}
                    focus={false}
                  />
                );
              })}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
