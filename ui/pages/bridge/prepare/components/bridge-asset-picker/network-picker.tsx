import React from 'react';
import {
  AvatarIcon,
  AvatarIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';
import { BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP } from '../../../../../../shared/constants/bridge';
import { Popover } from '../../../../../components/component-library';
import { NetworkListItem } from '../../../../../components/multichain';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
} from '../../../../../helpers/constants/design-system';

export const NetworkPicker = ({
  chains,
  selectedChainId,
  onNetworkChange,
  buttonElement,
  isOpen,
  onClose,
}: {
  chains: { chainId: CaipChainId; name: string }[];
  selectedChainId: CaipChainId | null;
  onNetworkChange: (chainId: CaipChainId | null) => void;
  buttonElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <Popover
      isOpen={isOpen}
      referenceElement={buttonElement}
      onClickOutside={onClose}
      preventOverflow={true}
      offset={[0, 12]}
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
        />
      ))}
    </Popover>
  );
};
