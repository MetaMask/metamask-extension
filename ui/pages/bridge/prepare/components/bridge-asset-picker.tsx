import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  isSolanaChainId,
  isBitcoinChainId,
  formatChainIdToHex,
  formatChainIdToCaip,
  isNonEvmChainId,
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
  SelectButton,
  PickerNetwork,
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
import { BridgeAssetPickerNetworkPopover } from './bridge-asset-picker-network-popover';
import { BridgeToken } from '../../../../ducks/bridge/types';
import AssetList from '../../../../components/multichain/asset-picker-amount/asset-picker-modal/AssetList';
import { useMultichainBalances } from '../../../../hooks/useMultichainBalances';

export const BridgeAssetPicker = ({
  networks,
  network,
  isOpen,
  onClose,
  onNetworkChange,
  onAssetChange,
  header,
}: {
  isOpen: boolean;
  onClose: () => void;
  onNetworkChange: React.ComponentProps<
    typeof BridgeAssetPickerNetworkPopover
  >['onNetworkChange'];
  networks: React.ComponentProps<
    typeof BridgeAssetPickerNetworkPopover
  >['networks'];
  network: React.ComponentProps<
    typeof BridgeAssetPickerNetworkPopover
  >['network'];
  onAssetChange: (asset: BridgeToken) => void;
  header: string;
}) => {
  const t = useI18nContext();
  const [isNetworkPickerOpen, setIsNetworkPickerOpen] = useState(false);

  const { assetsWithBalance } = useMultichainBalances();

  return (
    <Modal
      isOpen={isOpen}
      data-testid="bridge-asset-picker-modal"
      onClose={onClose}
    >
      <ModalOverlay />

      <ModalContent paddingTop={4} paddingBottom={4} gap={3}>
        <ModalHeader onClose={onClose}>{header}</ModalHeader>
        <PickerNetwork
          // network={network}
          label={network?.name ?? t('allNetworks')}
          src={network ? getImageForChainId(network.chainId) : undefined}
          onClick={() => setIsNetworkPickerOpen(true)}
          data-testid="bridge-asset-picker-modal__network-picker-button"
        />
        <ModalBody
          paddingRight={0}
          paddingLeft={0}
          data-testid="bridge-asset-picker-modal__body"
        >
          {isNetworkPickerOpen ? (
            <BridgeAssetPickerNetworkPopover
              networks={networks}
              network={network}
              onNetworkChange={(selectedNetwork) => {
                onNetworkChange(selectedNetwork);
                setIsNetworkPickerOpen(false);
              }}
            />
          ) : (
            <AssetList
              handleAssetChange={(asset) =>
                onAssetChange({
                  ...asset,
                  chainId: isNonEvmChainId(asset.chainId)
                    ? asset.chainId
                    : formatChainIdToHex(asset.chainId),
                })
              }
              tokenList={assetsWithBalance.map((asset) => ({
                ...asset,
                chainId: isNonEvmChainId(asset.chainId)
                  ? asset.chainId
                  : formatChainIdToHex(asset.chainId),
              }))}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
