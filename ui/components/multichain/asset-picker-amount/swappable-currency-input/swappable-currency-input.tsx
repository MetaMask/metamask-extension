import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  type Asset,
  type Amount,
  getSendMaxModeState,
} from '../../../../ducks/send';
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
  onAmountChange?: (newAmountRaw: string, newAmountFormatted: string) => void;
  asset?: Asset;
  amount: Amount;
  isAmountLoading?: boolean;
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
  isAmountLoading,
  onAmountChange,
}: SwappableCurrencyInputProps) {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const isFiatPrimary = useSelector(getIsFiatPrimary);
  const isSetToMax = useSelector(getSendMaxModeState);

  const TokenComponent = (
    <CurrencyInput
      className="asset-picker-amount__input"
      isFiatPreferred={isFiatPrimary}
      onChange={onAmountChange} // onChange controls disabled state, disabled if undefined
      hexValue={value}
      swapIcon={(onClick: React.MouseEventHandler) => (
        <SwapIcon onClick={onClick} />
      )}
      onPreferenceToggle={useCallback(
        () => dispatch(toggleCurrencySwitch()),
        [dispatch],
      )}
      asset={asset?.details}
      isSkeleton={isAmountLoading}
      isMatchingUpstream={isSetToMax}
    />
  );

  const NFTComponent = (
    <NFTInput
      integerValue={parseInt(value, 16)}
      onChange={onAmountChange}
      className="asset-picker-amount__input-nft"
    />
  );

  switch (assetType) {
    case AssetType.token:
    case AssetType.native:
      return TokenComponent;
    case AssetType.NFT:
      return asset.details?.standard === TokenStandard.ERC721
        ? null
        : NFTComponent;
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
