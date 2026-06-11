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
  BlockSize,
  FlexDirection,
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

  const { displayName, displayIcon, isAllNetworks } = useMemo(() => {
    if (selectedChainId === null) {
      return {
        displayName: 'All networks',
        displayIcon: IconName.Global,
        isAllNetworks: true,
      };
    }

    const networkName = chainNetworkNAmeAndImageMap.get(
      selectedChainId as string,
    )?.networkName;
    const networkImage = chainNetworkNAmeAndImageMap.get(
      selectedChainId as string,
    )?.networkImage;

    return {
      displayName: networkName || `Chain ${selectedChainId}`,
      displayIcon: networkImage || '',
      isAllNetworks: false,
    };
  }, [selectedChainId, chainNetworkNAmeAndImageMap]);

  const handleNetworkFilterClick = useCallback(() => {
    setIsNetworkFilterPopoverOpen(!isNetworkFilterPopoverOpen);
  }, [isNetworkFilterPopoverOpen]);

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

  const sharedModalSections = useMemo<NetworkSelectionSection[]>(
    () =>
      networkSections.map((section) => ({
        key: section.key,
        title: section.titleKey ? t(section.titleKey) : undefined,
        items: section.items.map(({ chainId }) => {
          const networkName =
            chainNetworkNAmeAndImageMap.get(chainId)?.networkName;
          const networkImage =
            chainNetworkNAmeAndImageMap.get(chainId)?.networkImage;

          return {
            key: chainId,
            chainId,
            name: networkName || `Chain ${chainId}`,
            iconSrc: networkImage || '',
            selected: selectedChainId === chainId,
            onClick: () => handleNetworkSelection(chainId),
            testId: `send-network-filter-${chainId}`,
          };
        }),
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
          <ModalContent
            size={ModalContentSize.Md}
            padding={0}
            modalDialogProps={{ padding: 0, height: BlockSize.Full }}
          >
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
            <ModalBody
              paddingLeft={0}
              paddingRight={0}
              className="flex min-h-0 flex-1 flex-col overflow-auto"
            >
              <NetworkListItem
                name={t('allNetworks')}
                iconSrc={IconName.Global}
                iconSize={IconSize.Sm}
                selected={selectedChainId === null}
                onClick={() => handleNetworkSelection(null)}
                focus={false}
              />
              {networkSections.length > 0 ? (
                <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
              ) : null}
              {networkSections.map((section, index) => (
                <Box
                  key={section.key}
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  width={BlockSize.Full}
                >
                  {index > 0 ? (
                    <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
                  ) : null}
                  {section.titleKey ? (
                    <Text
                      paddingLeft={4}
                      paddingRight={4}
                      paddingTop={4}
                      paddingBottom={2}
                      variant={TextVariant.bodyMd}
                      color={TextColor.textAlternative}
                    >
                      {t(section.titleKey)}
                    </Text>
                  ) : null}
                  {section.items.map(({ chainId }) => {
                    const networkName =
                      chainNetworkNAmeAndImageMap.get(chainId)?.networkName;
                    const networkImage =
                      chainNetworkNAmeAndImageMap.get(chainId)?.networkImage;

                    return (
                      <NetworkListItem
                        key={chainId}
                        chainId={chainId}
                        name={networkName || `Chain ${chainId}`}
                        iconSrc={networkImage || ''}
                        iconSize={AvatarNetworkSize.Sm}
                        selected={selectedChainId === chainId}
                        onClick={() => handleNetworkSelection(chainId)}
                        focus={false}
                      />
                    );
                  })}
                </Box>
              ))}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
