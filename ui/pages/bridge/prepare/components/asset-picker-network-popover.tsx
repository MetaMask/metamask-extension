import React from 'react';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  AvatarIcon,
  AvatarIconSize,
  IconColor,
  IconName,
} from '@metamask/design-system-react';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { CaipChainId } from '@metamask/utils';
import { Popover } from '../../../../components/component-library';
import { NetworkListItem } from '../../../../components/multichain';
import { getImageForChainId } from '../../../../selectors/multichain';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BorderRadius,
  Display,
} from '../../../../helpers/constants/design-system';
import { BridgeToken } from '../../../../ducks/bridge/types';

export const BridgeAssetPickerNetworkPopover = ({
  networks,
  network,
  onNetworkChange,
  isMultiselectEnabled = false,
  referenceElement,
  isOpen,
  onClose,
}: {
  networks: MultichainNetworkConfiguration[];
  network: MultichainNetworkConfiguration | null;
  onNetworkChange: (chainId: CaipChainId | null, token?: BridgeToken) => void;
  isMultiselectEnabled?: boolean;
  referenceElement: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const t = useI18nContext();

  return (
    <>
      <Popover
        isOpen={isOpen}
        referenceElement={referenceElement}
        onClickOutside={() => {
          onClose();
        }}
        preventOverflow={true}
        offset={[0, 12]}
        style={{
          zIndex: 100,
          padding: 0,
          overflow: 'scroll',
          minWidth: '100%',
          maxHeight: '90%',
        }}
        borderRadius={BorderRadius.XL}
        backgroundColor={BackgroundColor.backgroundSubsection}
        className="bridge-network-list-popover"
      >
        <NetworkListItem
          selected={!isMultiselectEnabled && !network}
          key="all-networks"
          name={t('allNetworks')}
          onClick={() => {
            onNetworkChange(null);
          }}
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
          avatarNetworkProps={{
            display: Display.None,
          }}
        />
        {networks.map((networkOption) => (
          <NetworkListItem
            selected={Boolean(
              network && network.chainId === networkOption.chainId,
            )}
            key={networkOption.chainId}
            name={networkOption.name}
            iconSrc={getImageForChainId(
              networkOption.isEvm
                ? formatChainIdToHex(networkOption.chainId)
                : networkOption.chainId,
            )}
            chainId={networkOption.chainId}
            onClick={() => {
              onNetworkChange(networkOption.chainId);
            }}
          />
        ))}
      </Popover>
    </>
  );
};
