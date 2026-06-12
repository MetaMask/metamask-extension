import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import {
  Box,
  BoxFlexDirection,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Modal,
} from '../../../components/component-library';
import { NetworkListItem } from '../../../components/multichain';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkSections } from '../../../helpers/utils/network-sections';
import { getIsNetworkManagementEnabled } from '../../../selectors/multichain/feature-flags';
import {
  NetworkSelectionModal,
  type NetworkSelectionSection,
} from '../../../components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal';

export const ContactNetworks = ({
  isOpen,
  onClose,
  selectedChainId,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedChainId?: string;
  onSelect?: (chainId: string) => void;
}) => {
  const t = useI18nContext();
  const isNetworkManagementEnabled = useSelector(getIsNetworkManagementEnabled);

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const networkSections = useMemo(
    () =>
      getNetworkSections(
        Object.values(networkConfigurations) as NetworkConfiguration[],
      ),
    [networkConfigurations],
  );

  const sharedModalSections = useMemo<NetworkSelectionSection[]>(
    () =>
      networkSections.map((section) => ({
        key: section.key,
        title: section.titleKey ? t(section.titleKey) : undefined,
        items: section.items.map(({ name, chainId }) => {
          const displayName =
            NETWORK_TO_SHORT_NETWORK_NAME_MAP[
              chainId as unknown as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
            ] ?? name;

          return {
            key: chainId,
            chainId,
            name: displayName,
            iconSrc: getImageForChainId(chainId),
            selected: selectedChainId === chainId,
            onClick: () => {
              onSelect?.(chainId);
              onClose();
            },
            testId: `contact-network-filter-${chainId}`,
          };
        }),
      })),
    [networkSections, onClose, onSelect, selectedChainId, t],
  );

  if (isNetworkManagementEnabled) {
    return (
      <NetworkSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('bridgeSelectNetwork')}
        sections={sharedModalSections}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="multichain-asset-picker__network-modal"
    >
      <ModalOverlay />
      <ModalContent
        padding={0}
        modalDialogProps={{ padding: 0, height: '100%' }}
      >
        <ModalHeader onBack={onClose} onClose={onClose}>
          {t('bridgeSelectNetwork')}
        </ModalHeader>
        <Box
          flexDirection={BoxFlexDirection.Column}
          className="flex min-h-0 w-full flex-1 flex-col overflow-auto"
        >
          {networkSections.map((section, index) => (
            <Box
              key={section.key}
              flexDirection={BoxFlexDirection.Column}
              className="flex w-full flex-col"
            >
              {index > 0 ? (
                <hr className="mx-4 mt-2 w-[calc(100%-32px)] border-0 border-t border-border-muted" />
              ) : null}
              {section.titleKey ? (
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={TextColor.TextAlternative}
                  className="px-4 pb-2 pt-4"
                >
                  {t(section.titleKey)}
                </Text>
              ) : null}
              {section.items.map(({ name, chainId }) => {
                const displayName =
                  NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                    chainId as unknown as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
                  ] ?? name;
                return (
                  <NetworkListItem
                    key={chainId}
                    chainId={chainId}
                    name={displayName}
                    iconSrc={getImageForChainId(chainId)}
                    selected={selectedChainId === chainId}
                    onClick={() => {
                      onSelect?.(chainId);
                      onClose();
                    }}
                    focus={false}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </ModalContent>
    </Modal>
  );
};
