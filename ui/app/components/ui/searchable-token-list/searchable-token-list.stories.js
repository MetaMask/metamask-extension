import React, { useState } from 'react'
import SearchableTokenList from '.'
import TokenListPlaceholder from '../../../pages/add-token/token-list-placeholder'

const tokens = [
  { name: '0x', logoUrl: `url(images/storybook-icons/${'0x.svg'})`, erc20: true, symbol: 'ZRX', decimals: 18, address: '0xE41d2489571d322189246DaFA5ebDe1F4699F498' },
  { name: 'AirSwap Token', logoUrl: `url(images/storybook-icons/${'AST.png'})`, erc20: true, symbol: 'AST', decimals: 4, address: '0x27054b13b1B798B345b591a4d22e6562d47eA75a' },
  { name: 'Basic Attention Token', logoUrl: `url(images/storybook-icons/${'BAT_icon.svg'})`, erc20: true, symbol: 'BAT', decimals: 18, address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF' },
  { name: 'Civil Token', logoUrl: `url(images/storybook-icons/${'CVL_token.svg'})`, erc20: true, symbol: 'CVL', decimals: 18, address: '0x01FA555c97D7958Fa6f771f3BbD5CCD508f81e22' },
  { name: 'Gladius', logoUrl: `url(images/storybook-icons/${'gladius.svg'})`, erc20: true, symbol: 'GLA', decimals: 8, address: '0x71D01dB8d6a2fBEa7f8d434599C237980C234e4C' },
  { name: 'Gnosis Token', logoUrl: `url(images/storybook-icons/${'gnosis.svg'})`, erc20: true, symbol: 'GNO', decimals: 18, address: '0x6810e776880C02933D47DB1b9fc05908e5386b96' },
  { name: 'MetaMark', logoUrl: `url(images/storybook-icons/${'metamark.svg'})`, erc20: true, decimals: 18, symbol: 'META', address: '0x617b3f8050a0BD94b6b1da02B4384eE5B4DF13F4' },
  { name: 'OmiseGO', logoUrl: `url(images/storybook-icons/${'omg.jpg'})`, erc20: true, symbol: 'OMG', decimals: 18, address: '0xd26114cd6EE289AccF82350c8d8487fedB8A0C07' },
  { name: 'Sai Stablecoin v1.0', logoUrl: `url(images/storybook-icons/${'sai.svg'})`, erc20: true, symbol: 'SAI', decimals: 18, address: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359' },
  { name: 'Tether USD', logoUrl: `url(images/storybook-icons/${'tether_usd.png'})`, erc20: true, symbol: 'USDT', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { name: 'WednesdayCoin', logoUrl: `url(images/storybook-icons/${'wed.png'})`, erc20: true, symbol: 'WED', decimals: 18, address: '0x7848ae8F19671Dc05966dafBeFbBbb0308BDfAbD' },
  { name: 'Wrapped BTC', logoUrl: `url(images/storybook-icons/${'wbtc.png'})`, erc20: true, symbol: 'WBTC', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
]

const handleToggleToken = (token, selectedTokens, setSelectedTokens) => {
  const { address } = token
  const selectedTokensCopy = { ...selectedTokens }

  if (address in selectedTokensCopy) {
    delete selectedTokensCopy[address]
  } else {
    selectedTokensCopy[address] = token
  }

  setSelectedTokens(selectedTokensCopy)
}


export default {
  title: 'SearchableTokenList',
}

export const AddTokenSearch = () => {
  const [selectedTokens, setSelectedTokens] = useState({})

  return (
    <div style={{ height: '82vh', width: '357px', border: '1px solid lightgrey' }}>
      <SearchableTokenList
        tokensToSearch={tokens}
        selectedTokens={selectedTokens}
        onToggleToken={(token) => handleToggleToken(token, selectedTokens, setSelectedTokens)}
        Placeholder={TokenListPlaceholder}
        className="add-token__search-token"
      />
    </div>
  )
}
