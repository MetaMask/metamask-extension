import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { NetworkConfiguration } from '@metamask/network-controller';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { NETWORK_TO_SHORT_NETWORK_NAME_MAP } from '../../../../shared/constants/bridge';
import { getImageForChainId } from '../../../selectors/multichain';
import { getNetworkSections } from '../../../helpers/utils/network-sections';
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

  return (
    <NetworkSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('bridgeSelectNetwork')}
      sections={sharedModalSections}
    />
  );
};
