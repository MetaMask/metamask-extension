import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ButtonIconSize,
  Icon,
  IconColor,
  IconName,
  IconSize,
} from '@metamask/design-system-react';
import { type CaipChainId } from '@metamask/utils';
import { uniqBy } from 'lodash';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../../shared/constants/bridge';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  PickerNetwork,
  TextField,
  ModalContentSize,
} from '../../../../../components/component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { getFromToken } from '../../../../../ducks/bridge/selectors';
import { toBridgeToken } from '../../../../../ducks/bridge/utils';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import { NetworkPicker } from './network-picker';
import { BridgeAssetList } from './lazy-asset-list';

export const BridgeAssetPicker = ({
  chainIds,
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
  selectedAsset: BridgeToken;
} & Pick<React.ComponentProps<typeof NetworkPicker>, 'chainIds'> &
  Pick<
    React.ComponentProps<typeof BridgeAssetList>,
    'onAssetChange' | 'excludedAssetId'
  >) => {
  // TODO remove this when actual balances are provided
  const fromToken = useSelector(getFromToken);
  const assetsWithBalance = fromToken ? [fromToken] : [];

  const t = useI18nContext();

  const networkPickerButtonRef = useRef<HTMLButtonElement>(null);
  const [isNetworkPickerOpen, setIsNetworkPickerOpen] = useState(false);
  // This is the network that the user has selected from the dropdown
  const [selectedChainId, setSelectedChainId] = useState<CaipChainId | null>(
    null,
  );

  const chainIdsList = useMemo(() => {
    return selectedChainId ? [selectedChainId] : chainIds;
  }, [selectedChainId, chainIds]);

  const chainIdsSet = useMemo(() => {
    return new Set(chainIdsList);
  }, [chainIdsList]);

  const assetsToInclude = useMemo(
    () =>
      uniqBy(
        assetsWithBalance.concat(selectedAsset).filter((token) => {
          const matchesChainIdFilter = chainIdsSet.has(
            formatChainIdToCaip(token.chainId),
          );

          return matchesChainIdFilter;
        }),
        (a) => a.assetId?.toLowerCase(),
      ),
    [chainIdsSet, selectedAsset],
  );

  // TODO call usePopularTokens hook here
  const popularTokensList = assetsToInclude
    .map(toBridgeToken)
    .filter((token) => token !== null);
  const isPopularTokensLoading = false;

  const selectedNetworkName = selectedChainId
    ? NETWORK_TO_SHORT_NETWORK_NAME_MAP[selectedChainId]
    : t('allNetworks');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const handleClose = useCallback(() => {
    setSearchQuery('');
    setIsNetworkPickerOpen(false);
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
            minWidth: 400,
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
              label={selectedNetworkName}
              labelProps={{
                variant: TextVariant.bodyMd,
              }}
              avatarNetworkProps={{
                src: selectedChainId
                  ? BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[selectedChainId]
                  : undefined,
                name: selectedNetworkName,
                style: {
                  display: selectedChainId ? undefined : Display.None,
                  width: 16,
                  height: 16,
                  borderWidth: 0,
                },
                borderRadius: BorderRadius.SM,
              }}
              ref={networkPickerButtonRef}
              onClick={() =>
                isNetworkPickerOpen
                  ? setIsNetworkPickerOpen(false)
                  : setIsNetworkPickerOpen(true)
              }
              data-testid="multichain-asset-picker__network"
              marginInline={4}
              paddingLeft={4}
              paddingRight={4}
              backgroundColor={BackgroundColor.backgroundMuted}
              borderRadius={BorderRadius.XL}
              width={BlockSize.Max}
              style={{ minHeight: 32 }}
            />
            <NetworkPicker
              buttonElement={networkPickerButtonRef.current}
              isOpen={isNetworkPickerOpen}
              chainIds={chainIds}
              selectedChainId={selectedChainId}
              onNetworkChange={(chainId) => {
                setSelectedChainId(chainId);
                setIsNetworkPickerOpen(false);
              }}
              onClose={() => setIsNetworkPickerOpen(false)}
            />
            <TextField
              autoFocus
              data-testid="asset-picker-modal-search-input"
              placeholder={t('enterTokenNameOrAddress')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              borderRadius={BorderRadius.XL}
              borderWidth={1}
              borderColor={BorderColor.borderMuted}
              inputProps={{
                disableStateStyles: true,
                textVariant: TextVariant.bodyMd,
                paddingRight: 2,
                borderColor: BorderColor.borderMuted,
              }}
              style={{
                minHeight: 48,
                paddingRight: 8,
                outline: 'none',
                borderColor: BorderColor.borderMuted,
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

            {!isNetworkPickerOpen && selectedAsset.assetId && (
              <BridgeAssetList
                assetsToInclude={assetsToInclude}
                // chainIds={chainIdsSet}
                // accountAddress={accountAddress}
                searchQuery={searchQuery}
                selectedAssetId={selectedAsset.assetId}
                popularTokensList={popularTokensList}
                isPopularTokensLoading={isPopularTokensLoading}
                onAssetChange={(asset: BridgeToken) => {
                  handleClose();
                  onAssetChange(asset);
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
