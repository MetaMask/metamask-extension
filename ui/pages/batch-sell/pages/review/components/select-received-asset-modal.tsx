import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextAlign,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { CaipAssetType } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { Modal } from '../../../../../components/component-library/modal/modal';
import { ModalOverlay } from '../../../../../components/component-library/modal-overlay/modal-overlay';
import { ModalContent } from '../../../../../components/component-library/modal-content/modal-content';
import { ModalHeader } from '../../../../../components/component-library/modal-header/modal-header';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { formatCurrencyAmount } from '../../../../bridge/utils/quote';
import { getCurrencyRateControllerCurrentCurrency as getCurrentCurrency } from '../../../../../../shared/lib/selectors/assets-migration';
import { BatchSellAsset } from '../../../../../ducks/batch-sell/types';

type SelectReceiveAssetModalProps = {
  assets: BatchSellAsset[];
  selectedAssetId: CaipAssetType;
  open: boolean;
  onClose: () => void;
  onSelectAsset: (assetId: CaipAssetType) => void;
};

type AssetListItemProps = BatchSellAsset & {
  selected: boolean;
  onClick: (assetId: CaipAssetType) => void;
};

const AssetListItem = ({
  assetId,
  symbol,
  tokenFiatAmount,
  iconUrl,
  selected,
  onClick,
}: AssetListItemProps) => {
  const currency = useSelector(getCurrentCurrency);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      flexDirection={BoxFlexDirection.Row}
      paddingHorizontal={4}
      paddingVertical={3}
      gap={4}
      className={twMerge(
        'cursor-pointer',
        selected ? 'bg-muted' : 'hover:bg-muted-hover',
      )}
      onClick={() => onClick(assetId)}
    >
      <AvatarToken
        size={AvatarTokenSize.Md}
        name={symbol}
        src={iconUrl ?? undefined}
      />
      <Box className="flex-1">
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {symbol}
        </Text>
      </Box>
      <Box>
        <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
          {formatCurrencyAmount(tokenFiatAmount?.toString(), currency, 2)}
        </Text>
      </Box>
    </Box>
  );
};

type AssetListProps = Pick<
  SelectReceiveAssetModalProps,
  'assets' | 'selectedAssetId' | 'onSelectAsset'
>;

const AssetList = ({
  assets,
  selectedAssetId,
  onSelectAsset,
}: AssetListProps) => {
  return (
    <>
      {assets.map((asset) => (
        <AssetListItem
          key={asset.assetId}
          {...asset}
          selected={asset.assetId === selectedAssetId}
          onClick={onSelectAsset}
        />
      ))}
    </>
  );
};

export const SelectReceivedAssetModal = ({
  assets,
  open,
  onClose,
  selectedAssetId,
  onSelectAsset,
}: SelectReceiveAssetModalProps) => {
  const t = useI18nContext();

  return (
    <Modal
      isOpen={open}
      isClosedOnEscapeKey
      isClosedOnOutsideClick
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>
          <Text textAlign={TextAlign.Center} variant={TextVariant.HeadingSm}>
            {t('batchSellReceiveStablecoin')}
          </Text>
        </ModalHeader>
        <AssetList
          assets={assets}
          selectedAssetId={selectedAssetId}
          onSelectAsset={onSelectAsset}
        />
      </ModalContent>
    </Modal>
  );
};
