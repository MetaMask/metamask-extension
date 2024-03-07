import React from 'react';
import { useDispatch } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useIsFiatPrimary from '../hooks/useIsFiatPrimary';
import type { Asset, Amount } from '../../../../ducks/send';
import { toggleCurrencySwitch } from '../../../../ducks/app/app';
import { AssetType } from '../../../../../shared/constants/transaction';
import { Box, Text } from '../../../component-library';
import {
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import CurrencyInput from '../../../app/currency-input';
import SwapIcon from './swap-icon';

interface BaseProps {
  assetType: AssetType;
  onAmountChange: (newAmount: string) => void;
  asset?: Asset;
  amount: Amount;
}

interface ERC20Props extends BaseProps {
  assetType: AssetType.token;
  asset: Asset;
}

interface NFTProps extends BaseProps {
  assetType: AssetType.NFT;
  asset: Asset;
}

interface NativeTokenProps extends BaseProps {
  assetType: AssetType.native;
}

interface UnsupportedTokenProps extends Omit<BaseProps, 'assetType'> {
  assetType: Exclude<
    AssetType,
    AssetType.NFT | AssetType.native | AssetType.token
  >;
  asset?: Asset;
}

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

  const isFiatPrimary = useIsFiatPrimary();

  switch (assetType) {
    case AssetType.token:
    case AssetType.native:
      return (
        <CurrencyInput
          className="asset-picker-amount__input"
          featureSecondary={isFiatPrimary}
          onChange={onAmountChange}
          hexValue={value}
          swapIcon={(onClick: React.MouseEventHandler) => (
            <SwapIcon onClick={onClick} />
          )}
          onPreferenceToggle={() => dispatch(toggleCurrencySwitch())}
          asset={asset?.details}
        />
      );

    default:
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
}
