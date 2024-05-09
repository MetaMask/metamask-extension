import React from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import { getSelectedAccountCachedBalance } from '../../../../selectors';
import { getNativeCurrency } from '../../../../ducks/metamask/metamask';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { AssetType } from '../../../../../shared/constants/transaction';
import { Box } from '../../../component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexWrap,
} from '../../../../helpers/constants/design-system';
import { TokenListItem } from '../..';
import { Asset, Token } from './types';
import AssetComponent from './Asset';

type AssetListProps = {
  handleAssetChange: (token: Token) => void;
  asset: Asset;
  tokenList: Token[];
};

export default function AssetList({
  handleAssetChange,
  asset,
  tokenList,
}: AssetListProps) {
  const selectedToken = asset.details?.address;

  const nativeCurrency = useSelector(getNativeCurrency);
  const balanceValue = useSelector(getSelectedAccountCachedBalance);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 4 });

  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 4 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(balanceValue, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const [secondaryCurrencyDisplay, secondaryCurrencyProperties] =
    useCurrencyDisplay(balanceValue, {
      numberOfDecimals: secondaryNumberOfDecimals,
      currency: secondaryCurrency,
      hideLabel: true,
    });

  return (
    <Box className="tokens-main-view-modal">
      {tokenList.map((token) => {
        const isSelected =
          token.address?.toLowerCase() === selectedToken?.toLowerCase();
        return (
          <Box
            padding={0}
            gap={0}
            margin={0}
            key={token.symbol}
            backgroundColor={
              isSelected
                ? BackgroundColor.primaryMuted
                : BackgroundColor.transparent
            }
            className={classnames('multichain-asset-picker-list-item', {
              'multichain-asset-picker-list-item--selected': isSelected,
            })}
            onClick={() => handleAssetChange(token)}
          >
            {isSelected ? (
              <Box
                className="multichain-asset-picker-list-item__selected-indicator"
                borderRadius={BorderRadius.pill}
                backgroundColor={BackgroundColor.primaryDefault}
              />
            ) : null}
            <Box
              key={token.address}
              padding={0}
              display={Display.Block}
              flexWrap={FlexWrap.NoWrap}
              alignItems={AlignItems.center}
              style={{ cursor: 'pointer' }}
            >
              <Box marginInlineStart={2}>
                {token.type === AssetType.native ? (
                  <TokenListItem
                    title={nativeCurrency}
                    primary={
                      primaryCurrencyProperties.value ??
                      secondaryCurrencyProperties.value
                    }
                    tokenSymbol={primaryCurrencyProperties.suffix}
                    secondary={secondaryCurrencyDisplay}
                    tokenImage={token.image}
                  />
                ) : (
                  <AssetComponent
                    key={token.address}
                    {...token}
                    decimalTokenAmount={token.string}
                    onClick={() => handleAssetChange(token)}
                  />
                )}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
