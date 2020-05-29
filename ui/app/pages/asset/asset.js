import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Redirect, useHistory, useParams } from 'react-router-dom'
import { createAccountLink } from '@metamask/etherscan-link'

import TransactionList from '../../components/app/transaction-list'
import { EthOverview, TokenOverview } from '../../components/app/wallet-overview'
import { getCurrentNetworkId, getSelectedIdentity } from '../../selectors/selectors'
import { getTokens } from '../../ducks/metamask/metamask'
import { DEFAULT_ROUTE } from '../../helpers/constants/routes'
import { showModal } from '../../store/actions'

import AssetNavigation from './components/asset-navigation'
import TokenOptions from './components/token-options'

const Asset = () => {
  const dispatch = useDispatch()
  const network = useSelector(getCurrentNetworkId)
  const selectedAccountName = useSelector((state) => getSelectedIdentity(state).name)
  const nativeCurrency = useSelector((state) => state.metamask.nativeCurrency)
  const tokens = useSelector(getTokens)
  const history = useHistory()
  const { asset } = useParams()

  const token = tokens.find((token) => token.address === asset)

  let assetName
  let optionsButton

  if (token) {
    assetName = token.symbol
    optionsButton = (
      <TokenOptions
        onRemove={() => dispatch(showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token }))}
        onViewEtherscan={() => {
          const url = createAccountLink(token.address, network)
          global.platform.openTab({ url })
        }}
        tokenSymbol={token.symbol}
      />
    )
  } else if (asset === nativeCurrency) {
    assetName = nativeCurrency
  } else {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />
  }

  const overview = token
    ? <TokenOverview className="asset__overview" token={token} />
    : <EthOverview className="asset__overview" />
  return (
    <div className="main-container asset__container">
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={assetName}
        onBack={() => history.push(DEFAULT_ROUTE)}
        optionsButton={optionsButton}
      />
      { overview }
      <TransactionList tokenAddress={token?.address} />
    </div>
  )
}

export default Asset
