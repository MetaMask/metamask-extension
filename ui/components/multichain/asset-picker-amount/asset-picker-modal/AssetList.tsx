import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import {
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
} from '../../../../selectors';
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

const MAX_UNOWNED_TOKENS_RENDERED = 30;

type AssetListProps = {
  handleAssetChange: (token: Token) => void;
  asset: Asset;
  tokenList: Token[];
  // searchQuery and all attached logic (e.g., filteredTokenList) could be pulled up if appropriate for a future refactor
  searchQuery: string;
};

export default function AssetList({
  handleAssetChange,
  asset,
  tokenList,
  searchQuery,
}: AssetListProps) {
  const selectedToken = asset.details?.address;

  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
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

  const filteredTokenList = useMemo(() => {
    const filteredTokens: Token[] = [];

    let token: Token;
    for (token of tokenList) {
      if (
        token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        token.symbol !== nativeCurrency
      ) {
        filteredTokens.push(token);
      }

      if (filteredTokens.length > MAX_UNOWNED_TOKENS_RENDERED) {
        break;
      }
    }

    // prepend native currency to token list if it matches search query
    if (nativeCurrency?.toLowerCase().includes(searchQuery.toLowerCase())) {
      filteredTokens.unshift({
        address: null,
        symbol: nativeCurrency,
        decimals: 18,
        image: nativeCurrencyImage,
        balance: balanceValue,
        string: primaryCurrencyProperties.value,
        type: AssetType.native,
      });
    }

    return filteredTokens;
  }, [
    tokenList,
    searchQuery,
    nativeCurrency,
    nativeCurrencyImage,
    balanceValue,
    primaryCurrencyProperties.value,
  ]);

  return (
    <Box className="tokens-main-view-modal">
      {filteredTokenList.map((token) => {
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
