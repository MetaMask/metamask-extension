import React from 'react';
import { useDispatch } from 'react-redux';
import { toHex } from '@metamask/controller-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import useIsFiatPrimary from '../hooks/useIsFiatPrimary';
import type { Asset, Amount } from '../../../../ducks/send';
import { toggleCurrencySwitch } from '../../../../ducks/app/app';
import { LARGE_SYMBOL_LENGTH } from '../constants';
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

// TODO: build out NFT logic
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

export default function SwappableCurrencyInput({
  assetType,
  asset,
  amount: { value },
  onAmountChange,
}: SwappableCurrencyInputProps) {
  const dispatch = useDispatch();

  const t = useI18nContext();

  const isFiatPrimary = useIsFiatPrimary();

  // FIXME: update swapping logic
  // TODO: add NFTs
  switch (assetType) {
    case AssetType.token:
    case AssetType.native:
      return (
        <CurrencyInput
          className="asset-picker-amount__input"
          featureSecondary={isFiatPrimary}
          onChange={onAmountChange}
          hexValue={toHex(value)}
          swapIcon={(onClick: React.MouseEventHandler) => (
            <SwapIcon ariaLabel={t('switchInputCurrency')} onClick={onClick} />
          )}
          onPreferenceToggle={() => dispatch(toggleCurrencySwitch())}
          hideSuffix={
            !isFiatPrimary ||
            (asset?.details?.symbol?.length || 0) > LARGE_SYMBOL_LENGTH
          }
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
