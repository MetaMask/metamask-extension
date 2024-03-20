import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { Asset, Amount } from '../../../../ducks/send';
import { toggleCurrencySwitch } from '../../../../ducks/app/app';
import {
  AssetType,
  TokenStandard,
} from '../../../../../shared/constants/transaction';
import { Box, Text } from '../../../component-library';
import {
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import CurrencyInput from '../../../app/currency-input';
import { getIsFiatPrimary } from '../utils';
import { NFTInput } from '../nft-input/nft-input';
import SwapIcon from './swap-icon';

type BaseProps = {
  assetType: AssetType;
  onAmountChange: (newAmount: string) => void;
  asset?: Asset;
  amount: Amount;
};

type ERC20Props = OverridingUnion<
  BaseProps,
  {
    assetType: AssetType.token;
    asset: Asset;
  }
>;

type NFTProps = OverridingUnion<
  BaseProps,
  {
    assetType: AssetType.NFT;
    asset: Asset;
  }
>;

type NativeTokenProps = OverridingUnion<
  BaseProps,
  {
    assetType: AssetType.native;
  }
>;

type UnsupportedTokenProps = OverridingUnion<
  Omit<BaseProps, 'assetType'>,
  {
    assetType: Exclude<
      AssetType,
      AssetType.NFT | AssetType.native | AssetType.token
    >;
    asset?: Asset;
  }
>;

type SwappableCurrencyInputProps =
  | ERC20Props
  | NFTProps
  | NativeTokenProps
  | UnsupportedTokenProps;

export function SwappableCurrencyInput({
  assetType,
  asset,
  amount: { value },
  onAmountChange,
}: SwappableCurrencyInputProps) {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const isFiatPrimary = useSelector(getIsFiatPrimary);

  switch (assetType) {
    case AssetType.token:
    case AssetType.native:
      return (
        <CurrencyInput
          className="asset-picker-amount__input"
          isFiatPreferred={isFiatPrimary}
          onChange={onAmountChange}
          hexValue={value}
          swapIcon={(onClick: React.MouseEventHandler) => (
            <SwapIcon onClick={onClick} />
          )}
          onPreferenceToggle={() => dispatch(toggleCurrencySwitch())}
          asset={asset?.details}
        />
      );
    case AssetType.NFT:
      if (asset.details?.standard === TokenStandard.ERC721) {
        return null;
      }
      return (
        <NFTInput
          integerValue={parseInt(value, 16)}
          onChange={onAmountChange}
          className="asset-picker-amount__input-nft"
        />
      );
    default:
    // do nothing
  }

  return (
    <Box marginLeft={'auto'}>
      <Text variant={TextVariant.bodySm}>{t('tokenId')}</Text>
      <Text
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Bold}
        marginLeft={10}
      >
        {asset?.details?.tokenId}
      </Text>
    </Box>
  );
}
