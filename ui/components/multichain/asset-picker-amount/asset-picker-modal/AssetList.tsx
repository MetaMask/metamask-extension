import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import classnames from 'classnames';
import isEqual from 'lodash/isEqual';
import {
  getNativeCurrencyImage,
  getSelectedAccountCachedBalance,
  getSelectedInternalAccount,
  getShouldHideZeroBalanceTokens,
} from '../../../../selectors';
import {
  getNativeCurrency,
  getTokens,
} from '../../../../ducks/metamask/metamask';
import { useTokenTracker } from '../../../../hooks/useTokenTracker';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { AssetType } from '../../../../../shared/constants/transaction';
import { Box } from '../../../component-library';
import TokenCell from '../../../app/token-cell';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexWrap,
} from '../../../../helpers/constants/design-system';
import { TokenListItem } from '../..';
import { Asset, Token } from './types';

type AssetListProps = {
  handleAssetChange: (token: Token) => void;
  asset: Asset;
  searchQuery: string;
};

export default function AssetList({
  handleAssetChange,
  asset,
  searchQuery,
}: AssetListProps) {
  const { address: selectedAddress } = useSelector(getSelectedInternalAccount);
  const selectedToken = asset.details?.address;

  const nativeCurrencyImage = useSelector(getNativeCurrencyImage);
  const nativeCurrency = useSelector(getNativeCurrency);
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );
  const balanceValue = useSelector(getSelectedAccountCachedBalance);
  const tokens = useSelector(getTokens, isEqual);
  const { tokensWithBalances } = useTokenTracker({
    tokens,
    address: selectedAddress,
    hideZeroBalanceTokens: Boolean(shouldHideZeroBalanceTokens),
  });

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
    });

  const tokenList = useMemo(() => {
    const filteredTokens: Token[] = tokensWithBalances.filter((token: Token) =>
      token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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
    tokensWithBalances,
    searchQuery,
    nativeCurrency,
    nativeCurrencyImage,
    balanceValue,
    primaryCurrencyProperties.value,
  ]);

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
                  <TokenCell
                    key={token.address}
                    {...token}
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
