import React, { useMemo } from 'react';
import { type CaipChainId } from '@metamask/utils';
import { IconName } from '@metamask/design-system-react';
import { BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP } from '../../../../shared/constants/bridge';
import {
  NetworkSelectionModal,
  type NetworkSelectionSection,
} from '../../../components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getNetworkSections } from '../../../helpers/utils/network-sections';
import {
  CHAIN_VALUE_ORDER_AB_KEY,
  CHAIN_VALUE_ORDER_AB_TEST_EXPOSURE_METADATA,
  CHAIN_VALUE_ORDER_AB_TEST_VARIANTS,
} from '../../../../shared/lib/ab-testing/configs/chain-value-order';
import { useABTest } from '../../../hooks/useABTest';
import { useChainValueOrder } from '../hooks/useChainValueOrder';

type NetworkPickerProps = {
  chains: { chainId: CaipChainId; name: string }[];
  selectedChainId: CaipChainId | null;
  disabledChainId?: CaipChainId;
  onNetworkChange: (chainId: CaipChainId | null) => void;
  isOpen: boolean;
  onClose: () => void;
  testId: string;
};

const NetworkPickerContent = ({
  chains,
  selectedChainId,
  disabledChainId,
  onNetworkChange,
  isOpen,
  onClose,
  testId,
}: NetworkPickerProps) => {
  const t = useI18nContext();

  const networkSections = useMemo(() => getNetworkSections(chains), [chains]);

  const sections = useMemo<NetworkSelectionSection[]>(
    () =>
      networkSections.map((section) => ({
        key: section.key,
        title: section.titleKey ? t(section.titleKey) : undefined,
        items: section.items.map(({ chainId, name }) => ({
          key: chainId,
          chainId,
          name,
          iconSrc: BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[chainId],
          selected: selectedChainId === chainId,
          disabled: disabledChainId === chainId,
          onClick: () => {
            if (disabledChainId === chainId) {
              return;
            }
            onNetworkChange(chainId);
          },
          testId: `${testId}-item-${chainId}`,
        })),
      })),
    [
      disabledChainId,
      networkSections,
      onNetworkChange,
      selectedChainId,
      t,
      testId,
    ],
  );

  return (
    <NetworkSelectionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('bridgeSelectNetwork')}
      data-testid={testId}
      topItem={{
        key: 'all-networks',
        name: t('allNetworks'),
        iconName: IconName.Global,
        selected: !selectedChainId,
        onClick: () => onNetworkChange(null),
        testId: `${testId}-all-networks`,
      }}
      sections={sections}
    />
  );
};

const NetworkValueOrderedPicker = (props: NetworkPickerProps) => {
  const orderedChains = useChainValueOrder(props.chains);

  return <NetworkPickerContent {...props} chains={orderedChains} />;
};

export const NetworkPicker = (props: NetworkPickerProps) => {
  const { variant } = useABTest(
    CHAIN_VALUE_ORDER_AB_KEY,
    CHAIN_VALUE_ORDER_AB_TEST_VARIANTS,
    CHAIN_VALUE_ORDER_AB_TEST_EXPOSURE_METADATA,
    { trackExposure: props.isOpen },
  );

  if (props.isOpen && variant.orderByValue) {
    return <NetworkValueOrderedPicker {...props} />;
  }

  return <NetworkPickerContent {...props} />;
};
