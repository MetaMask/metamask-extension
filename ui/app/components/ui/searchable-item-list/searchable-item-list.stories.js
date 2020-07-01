import React, { useState } from 'react'
import SearchableTokenList from '.'
import TokenListPlaceholder from '../../../pages/add-token/token-list-placeholder'

const tokens = [
  { primaryLabel: '0x (ZRX)', name: '0x', backgroundImageUrl: `images/storybook-icons/0x.svg`, erc20: true, symbol: 'ZRX', decimals: 18, address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498' },
  { primaryLabel: 'AirSwap Token (AST)', name: 'AirSwap Token', backgroundImageUrl: `images/storybook-icons/AST.png`, erc20: true, symbol: 'AST', decimals: 4, address: '0x27054b13b1B798B345b591a4d22e6562d47eA75a' },
  { primaryLabel: 'Basic Attention Token (BAT)', name: 'Basic Attention Token', backgroundImageUrl: `images/storybook-icons/BAT_icon.svg`, erc20: true, symbol: 'BAT', decimals: 18, address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF' },
  { primaryLabel: 'Civil Token (CVL)', name: 'Civil Token', backgroundImageUrl: `images/storybook-icons/CVL_token.svg`, erc20: true, symbol: 'CVL', decimals: 18, address: '0x01FA555c97D7958Fa6f771f3BbD5CCD508f81e22' },
  { primaryLabel: 'Gladius (GLA)', name: 'Gladius', backgroundImageUrl: `images/storybook-icons/gladius.svg`, erc20: true, symbol: 'GLA', decimals: 8, address: '0x71D01dB8d6a2fBEa7f8d434599C237980C234e4C' },
  { primaryLabel: 'Gnosis Token (GNO)', name: 'Gnosis Token', backgroundImageUrl: `images/storybook-icons/gnosis.svg`, erc20: true, symbol: 'GNO', decimals: 18, address: '0x6810e776880C02933D47DB1b9fc05908e5386b96' },
  { primaryLabel: 'MetaMark (META)', name: 'MetaMark', backgroundImageUrl: `images/storybook-icons/metamark.svg`, erc20: true, decimals: 18, symbol: 'META', address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4' },
  { primaryLabel: 'OmiseGO (OMG)', name: 'OmiseGO', backgroundImageUrl: `images/storybook-icons/omg.jpg`, erc20: true, symbol: 'OMG', decimals: 18, address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07' },
  { primaryLabel: 'Sai Stablecoin v1.0 (SAI)', name: 'Sai Stablecoin v1.0', backgroundImageUrl: `images/storybook-icons/sai.svg`, erc20: true, symbol: 'SAI', decimals: 18, address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359' },
  { primaryLabel: 'Tether USD (USDT)', name: 'Tether USD', backgroundImageUrl: `images/storybook-icons/tether_usd.png`, erc20: true, symbol: 'USDT', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { primaryLabel: 'WednesdayCoin (WED)', name: 'WednesdayCoin', backgroundImageUrl: `images/storybook-icons/wed.png`, erc20: true, symbol: 'WED', decimals: 18, address: '0x7848ae8F19671Dc05966dafBeFbBbb0308BDfAbD' },
  { primaryLabel: 'Wrapped BTC (WBTC)', name: 'Wrapped BTC', backgroundImageUrl: `images/storybook-icons/wbtc.png`, erc20: true, symbol: 'WBTC', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
]

const handleToggleToken = (token, currentTokens, setSelectedTokens) => {
  const currentTokensCopy = [ ...currentTokens ]
  const toggleIndex = currentTokensCopy.findIndex((searchToken) => searchToken.address === token.address)
  currentTokensCopy[toggleIndex].selected = !currentTokensCopy[toggleIndex].selected

  setSelectedTokens(currentTokensCopy)
}


export default {
  title: 'SearchableItemList',
}

export const AddTokenSearch = () => {
  const [tokensToSearch, setTokens] = useState(tokens)

  return (
    <div style={{ height: '82vh', width: '357px', border: '1px solid lightgrey', overflowY: 'auto' }}>
      <SearchableTokenList
        itemsToSearch={tokensToSearch}
        onToggleItem={(token) => handleToggleToken(token, tokensToSearch, setTokens)}
        Placeholder={TokenListPlaceholder}
        className="add-token__search-token"
        searchPlaceholderText="Search Tokens"
        fuseSearchKeys={[{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]}
        listTitle="Search Results"
      />
    </div>
  )
}

const altTokens = tokens.map((token) => ({
  ...token,
  primaryLabel: token.symbol,
  secondaryLabel: token.name,
  rightPrimaryLabel: `${(Math.random() * 100).toFixed(Math.floor(Math.random() * 6))} ${token.symbol}`,
  rightSecondaryLabel: '$' + (Math.random() * 1000).toFixed(2),
}))

export const TokenSearchSelect = () => {
  return (
    <div style={{ height: '82vh', width: '357px' }}>
      <SearchableTokenList
        itemsToSearch={altTokens}
        Placeholder={({ searchQuery }) => <div className="token__placeholder">{`No tokens available that match “${searchQuery}”.`}</div>}
        className="token__search-token"
        searchPlaceholderText="Search for a token"
        fuseSearchKeys={[{ name: 'name', weight: 0.5 }, { name: 'symbol', weight: 0.5 }]}
        defaultToAll
      />
    </div>
  )
}
