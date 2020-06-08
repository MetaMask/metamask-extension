import React from 'react'
import PropTypes from 'prop-types'
import contracts from 'eth-contract-metadata'
import { isEqual } from 'lodash'

import TokenCell from '../token-cell'
import { useI18nContext } from '../../../hooks/useI18nContext'
import { useTokenTracker } from '../../../hooks/useTokenTracker'
import { useSelector } from 'react-redux'
import { getAssetImages } from '../../../selectors'
import { getTokens } from '../../../ducks/metamask/metamask'

const defaultTokens = []
for (const address in contracts) {
  const contract = contracts[address]
  if (contract.erc20) {
    contract.address = address
    defaultTokens.push(contract)
  }
}

export default function TokenList ({ onTokenClick }) {
  const t = useI18nContext()
  const assetImages = useSelector(getAssetImages)
  // use `isEqual` comparison function because the token array is serialized
  // from the background so it has a new reference with each background update,
  // even if the tokens haven't changed
  const tokens = useSelector(getTokens, isEqual)
  const { loading, error, tokensWithBalances } = useTokenTracker(tokens)

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '250px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px',
        }}
      >
        {t('loadingTokens')}
      </div>
    )
  }

  return (
    <div>
      {tokensWithBalances.map((tokenData, index) => {
        tokenData.image = assetImages[tokenData.address]
        return (
          <TokenCell
            key={index}
            {...tokenData}
            outdatedBalance={Boolean(error)}
            onClick={onTokenClick}
          />
        )
      })}
    </div>
  )
}

TokenList.propTypes = {
  onTokenClick: PropTypes.func.isRequired,
}
