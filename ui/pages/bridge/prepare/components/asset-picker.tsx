import React, { useCallback, useRef, useState } from 'react';
import {
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';
import { BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP } from '../../../../../shared/constants/bridge';

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  PickerNetwork,
  TextField,
  ModalContentSize,
} from '../../../../components/component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { useTokenList } from '../../../../hooks/bridge/useTokenList';
import { AssetPickerNetworkPopover } from './asset-picker-network-popover';
import { AssetPickerTokenList } from './asset-list';

export const BridgeAssetPicker = ({
  networks,
  isOpen,
  onClose,
  onAssetChange,
  header,
  selectedAsset,
  accountAddress,
  ...assetListProps
}: {
  isOpen: boolean;
  accountAddress: string;
  onClose: () => void;
  header: string;
} & Pick<React.ComponentProps<typeof AssetPickerNetworkPopover>, 'networks'> &
  Pick<
    React.ComponentProps<typeof AssetPickerTokenList>,
    'selectedAsset' | 'onAssetChange' | 'excludedAssetId'
  >) => {
  const t = useI18nContext();
  const [isNetworkPickerOpen, setIsNetworkPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const referenceElementRef = useRef<HTMLButtonElement>(null);
  const [selectedChainId, setSelectedChainId] = useState<CaipChainId | null>(
    null,
  );
  const selectedNetwork = networks.find(
    (network) => network.chainId === selectedChainId,
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    abortControllerRef.current?.abort('=====closing asset picker');
    abortControllerRef.current = null;
    setIsNetworkPickerOpen(false);
    setSelectedChainId(selectedAsset?.chainId);
    onClose();
  }, [onClose]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        data-testid="bridge-asset-picker-modal"
        onClose={handleClose}
      >
        <ModalOverlay onClick={handleClose} />
        <ModalContent
          paddingTop={4}
          paddingBottom={4}
          gap={3}
          size={ModalContentSize.Md}
          height={BlockSize.Full}
          width={BlockSize.Full}
          modalDialogProps={{
            height: BlockSize.Full,
            minWidth: '400px',
          }}
        >
          <ModalHeader
            closeButtonProps={{ size: ButtonIconSize.Sm }}
            onClose={handleClose}
          >
            {header}
          </ModalHeader>
          <ModalBody
            height={BlockSize.Full}
            paddingLeft={0}
            paddingRight={0}
            data-testid="bridge-asset-picker-modal__body"
            gap={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <PickerNetwork
              label={selectedNetwork?.name ?? t('allNetworks')}
              labelProps={{
                variant: TextVariant.bodyMd,
              }}
              avatarNetworkProps={{
                src: selectedChainId
                  ? BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[selectedChainId]
                  : undefined,
                name: selectedNetwork?.name ?? t('allNetworks'),
                style: {
                  display: selectedChainId ? undefined : Display.None,
                },
              }}
              ref={referenceElementRef}
              onClick={() =>
                isNetworkPickerOpen
                  ? setIsNetworkPickerOpen(false)
                  : setIsNetworkPickerOpen(true)
              }
              data-testid="asset-picker-network-popover__button"
              marginInline={4}
              paddingLeft={4}
              paddingRight={4}
              backgroundColor={BackgroundColor.backgroundMuted}
              borderRadius={BorderRadius.XL}
              width={BlockSize.Max}
              style={{ minHeight: '32px' }}
            />
            <AssetPickerNetworkPopover
              referenceElement={referenceElementRef.current}
              isOpen={isNetworkPickerOpen}
              networks={networks}
              selectedChainId={selectedChainId}
              onNetworkChange={(chainId) => {
                setSelectedChainId(chainId);
                setSearchQuery('');
                setIsNetworkPickerOpen(false);
              }}
              onClose={() => setIsNetworkPickerOpen(false)}
            />
            <TextField
              autoFocus
              data-testid="destination-account-picker-modal-search-input"
              placeholder={t('enterTokenNameOrAddress')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius={BorderRadius.XL}
              borderWidth={1}
              borderColor={BorderColor.borderMuted}
              inputProps={{
                disableStateStyles: true,
                textVariant: TextVariant.bodyMd,
                paddingRight: 2,
              }}
              style={{
                minHeight: 48,
                paddingRight: '8px',
                outline: 'none',
              }}
              marginInline={4}
              startAccessory={
                <Icon
                  color={IconColor.IconAlternative}
                  name={IconName.Search}
                  size={IconSize.Md}
                />
              }
            />

            {!isNetworkPickerOpen && (
              <AssetPickerTokenList
                chainId={selectedChainId}
                accountAddress={accountAddress}
                abortControllerRef={abortControllerRef}
                searchQuery={searchQuery}
                selectedAsset={selectedAsset}
                onAssetChange={(asset) => {
                  handleClose();
                  onAssetChange(asset);
                  setSelectedChainId(asset.chainId);
                }}
                {...assetListProps}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
