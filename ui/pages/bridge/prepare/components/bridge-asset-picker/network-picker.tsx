import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  AvatarIcon,
  AvatarIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';
import { BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP } from '../../../../../../shared/constants/bridge';
import {
  IconName as ComponentIconName,
  Popover,
  PopoverRole,
} from '../../../../../components/component-library';
import { NetworkListItem } from '../../../../../components/multichain/network-list-item';
import {
  NetworkSelectionModal,
  type NetworkSelectionSection,
} from '../../../../../components/app/assets/asset-list/asset-list-control-bar/home-network-filter-modal';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { getNetworkSections } from '../../../../../helpers/utils/network-sections';
import { getIsNetworkManagementEnabled } from '../../../../../selectors/multichain/feature-flags';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export const NetworkPicker = ({
  chains,
  selectedChainId,
  disabledChainId,
  onNetworkChange,
  buttonElement,
  isOpen,
  onClose,
  testId,
}: {
  chains: { chainId: CaipChainId; name: string }[];
  selectedChainId: CaipChainId | null;
  disabledChainId?: CaipChainId;
  onNetworkChange: (chainId: CaipChainId | null) => void;
  buttonElement?: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  testId: string;
}) => {
  const t = useI18nContext();
  const isNetworkManagementEnabled = useSelector(getIsNetworkManagementEnabled);

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

  if (isNetworkManagementEnabled) {
    return (
      <NetworkSelectionModal
        isOpen={isOpen}
        onClose={onClose}
        title={t('bridgeSelectNetwork')}
        data-testid={testId}
        topItem={{
          key: 'all-networks',
          name: t('allNetworks'),
          iconSrc: ComponentIconName.Global,
          selected: !selectedChainId,
          onClick: () => onNetworkChange(null),
          testId: `${testId}-all-networks`,
        }}
        sections={sections}
      />
    );
  }

  return (
    <Popover
      isOpen={isOpen}
      referenceElement={buttonElement}
      role={PopoverRole.Dialog}
      onClickOutside={onClose}
      offset={[0, 12]}
      data-testid={testId}
      style={{
        padding: 0,
        width: 'calc(100% - 24px)',
        height: '90%',
        maxHeight: '90%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'scroll',
      }}
      borderRadius={BorderRadius.XL}
      backgroundColor={BackgroundColor.backgroundSubsection}
      className="bridge-network-list-popover"
      marginInline={3}
    >
      <NetworkListItem
        selected={!selectedChainId}
        key="all-networks"
        name={t('allNetworks')}
        onClick={() => {
          onNetworkChange(null);
        }}
        focus={false}
        startAccessory={
          <AvatarIcon
            iconName={IconName.Global}
            size={AvatarIconSize.Md}
            color={IconColor.PrimaryDefault}
            iconProps={{
              color: IconColor.PrimaryDefault,
            }}
          />
        }
      />
      {chains.map(({ chainId, name }) => (
        <NetworkListItem
          selected={Boolean(selectedChainId === chainId)}
          key={chainId}
          name={name}
          iconSrc={BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[chainId]}
          chainId={chainId}
          focus={false}
          onClick={() => {
            onNetworkChange(chainId);
          }}
          disabled={disabledChainId === chainId}
        />
      ))}
    </Popover>
  );
};
