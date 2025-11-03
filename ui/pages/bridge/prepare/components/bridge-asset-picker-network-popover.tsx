import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  isSolanaChainId,
  isBitcoinChainId,
  formatChainIdToHex,
} from '@metamask/bridge-controller';
import {
  AvatarBaseSize,
  AvatarNetworkSize,
  Icon,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import {
  TextField,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalProps,
  ModalBody,
  ModalHeader,
} from '../../../../components/component-library';
import {
  BackgroundColor,
  BorderRadius,
  TextAlign,
  TextColor,
} from '../../../../helpers/constants/design-system';
import { t } from '../../../../../shared/lib/translate';
import {
  getIsToOrFromNonEvm,
  getToAccounts,
  getToChain,
} from '../../../../ducks/bridge/selectors';
import { useExternalAccountResolution } from '../../hooks/useExternalAccountResolution';
import type { DestinationAccount } from '../types';
import DestinationAccountListItem from './destination-account-list-item';
import { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { NetworkListItem } from '../../../../components/multichain';
import { getImageForChainId } from '../../../../selectors/multichain';
import { CaipChainId } from '@metamask/utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export const BridgeAssetPickerNetworkPopover = ({
  networks,
  network,
  onNetworkChange,
}: {
  networks: MultichainNetworkConfiguration[];
  network: MultichainNetworkConfiguration | null;
  onNetworkChange: (network: MultichainNetworkConfiguration | null) => void;
}) => {
  const t = useI18nContext();
  // TODO if fromChainId is null, show all networks
  return (
    <>
      <NetworkListItem
        selected={!network}
        key="all-networks"
        name={t('allNetworks')}
        iconSrc={IconName.Global}
        onClick={() => {
          onNetworkChange(null);
        }}
      />
      {networks.map((networkOption) => (
        <NetworkListItem
          selected={network?.chainId === networkOption.chainId}
          key={networkOption.chainId}
          name={networkOption.name}
          iconSrc={getImageForChainId(
            networkOption.isEvm
              ? formatChainIdToHex(networkOption.chainId)
              : networkOption.chainId,
          )}
          chainId={networkOption.chainId}
          onClick={() => {
            onNetworkChange(network);
          }}
        />
      ))}
    </>
  );
};
