import React, { useState } from 'react'
import PropTypes from 'prop-types'
import TokenList from './token-list'
import TokenSearch from './token-search'

export default function SearchableTokenList ({
  tokenSelectorError = '',
  selectedTokens = [],
  onToggleToken = null,
  Placeholder = null,
  className = '',
  matchedTokens = [],
  tokensToSearch = [],
}) {
  const [results, setResults] = useState([])

  return (
    <div className={className}>
      <TokenSearch
        listToSearch={tokensToSearch}
        fuseSearchKeys={[{ name: 'name', weight: 0.499 }, { name: 'symbol', weight: 0.499 }, { name: 'address', weight: 0.002 }]}
        onSearch={({ results = [] }) => setResults(results)}
        error={tokenSelectorError}
      />
      <TokenList
        matchedTokens={matchedTokens}
        results={results}
        selectedTokens={selectedTokens}
        onToggleToken={onToggleToken}
        Placeholder={Placeholder}
      />
    </div>
  )
}

SearchableTokenList.propTypes = {
  tokenSelectorError: PropTypes.string,
  selectedTokens: PropTypes.array,
  matchedTokens: PropTypes.array,
  tokensToSearch: PropTypes.array,
  onToggleToken: PropTypes.func,
  Placeholder: PropTypes.element,
  className: PropTypes.string,
}
