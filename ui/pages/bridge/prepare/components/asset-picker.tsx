import React, { useRef, useState } from 'react';
import {
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
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
import { BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP } from '../../../../../shared/constants/bridge';
import { BridgeAssetPickerNetworkPopover } from './asset-picker-network-popover';
import { AssetPickerTokenList } from './asset-list';

export const BridgeAssetPicker = ({
  networks,
  network,
  isOpen,
  onClose,
  onNetworkChange,
  onAssetChange,
  header,
  ...assetListProps
}: {
  isOpen: boolean;
  onClose: () => void;
  header: string;
} & Pick<
  React.ComponentProps<typeof BridgeAssetPickerNetworkPopover>,
  'onNetworkChange' | 'networks' | 'network' | 'isMultiselectEnabled'
> &
  Pick<
    React.ComponentProps<typeof AssetPickerTokenList>,
    'asset' | 'onAssetChange'
  >) => {
  const t = useI18nContext();
  const [isNetworkPickerOpen, setIsNetworkPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const referenceElementRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Modal
        isOpen={isOpen}
        data-testid="bridge-asset-picker-modal"
        onClose={() => {
          setIsNetworkPickerOpen(false);
        }}
      >
        <ModalOverlay onClick={onClose} />
        <ModalContent
          paddingTop={4}
          paddingBottom={4}
          gap={3}
          size={ModalContentSize.Md}
        >
          <ModalHeader
            closeButtonProps={{ size: ButtonIconSize.Sm }}
            onClose={onClose}
          >
            {header}
          </ModalHeader>
          <ModalBody
            height={BlockSize.Screen}
            paddingLeft={0}
            paddingRight={0}
            data-testid="bridge-asset-picker-modal__body"
            gap={4}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            <PickerNetwork
              label={network?.name ?? t('allNetworks')}
              labelProps={{
                variant: TextVariant.bodyMd,
              }}
              avatarNetworkProps={{
                src: network?.chainId
                  ? BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[network.chainId]
                  : undefined,
                name: network?.name ?? t('allNetworks'),
                style: {
                  display: network ? undefined : Display.None,
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
            <BridgeAssetPickerNetworkPopover
              referenceElement={referenceElementRef.current}
              isOpen={isNetworkPickerOpen}
              networks={networks}
              network={network}
              onNetworkChange={(selectedNetwork) => {
                onNetworkChange(selectedNetwork);
                setSearchQuery('');
                setIsNetworkPickerOpen(false);
              }}
              onClose={() => setIsNetworkPickerOpen(false)}
            />
            {!isNetworkPickerOpen && (
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
            )}
            {!isNetworkPickerOpen && (
              <AssetPickerTokenList
                searchQuery={searchQuery}
                networks={networks}
                network={network}
                onNetworkChange={onNetworkChange}
                onAssetChange={onAssetChange}
                {...assetListProps}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
